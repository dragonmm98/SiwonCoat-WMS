import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { DeliveryStatus, Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateDeliveryDto } from "./dto/create-delivery.dto";
import { DeliveryActionDto } from "./dto/delivery-action.dto";

const shipmentInclude = {
  order: {
    select: {
      id: true,
      orderNumber: true,
      recipient: true,
      address: true,
      status: true,
      lines: { select: { orderedQty: true } },
    },
  },
  events: { orderBy: { occurredAt: "desc" as const } },
} satisfies Prisma.DeliveryShipmentInclude;

const nextStatus: Partial<Record<DeliveryStatus, DeliveryStatus>> = {
  CREATED: "PICKED_UP",
  PICKED_UP: "IN_TRANSIT",
  IN_TRANSIT: "OUT_FOR_DELIVERY",
  OUT_FOR_DELIVERY: "DELIVERED",
};

const eventDescriptions: Record<DeliveryStatus, string> = {
  CREATED: "Sandbox shipment and label created",
  PICKED_UP: "Parcel collected from Seoul FC",
  IN_TRANSIT: "Parcel moving through the sandbox network",
  OUT_FOR_DELIVERY: "Courier is completing the final delivery leg",
  DELIVERED: "Parcel delivered to the recipient",
  FAILED: "Simulated delivery exception",
  CANCELLED: "Sandbox shipment cancelled",
};

@Injectable()
export class DeliveriesService {
  constructor(private readonly prisma: PrismaService) {}

  providers() {
    return [
      { id: "SANDBOX", name: "Sandbox Delivery", status: "ACTIVE", description: "Built-in provider for labels and tracking simulation", capabilities: ["Labels", "Tracking", "Webhooks"] },
      { id: "KAKAO", name: "Kakao Mobility", status: "COMING_SOON", description: "Quick and walking delivery for local fulfillment", capabilities: ["Same day", "Local delivery"] },
      { id: "KOREA_POST", name: "Korea Post", status: "COMING_SOON", description: "Domestic parcel and EMS delivery services", capabilities: ["Domestic", "International"] },
      { id: "CJ", name: "CJ Logistics", status: "PLANNED", description: "Domestic parcel carrier integration", capabilities: ["Parcel", "Tracking"] },
      { id: "HANJIN", name: "Hanjin", status: "PLANNED", description: "Domestic and international logistics", capabilities: ["Parcel", "Freight"] },
      { id: "LOTTE", name: "Lotte Global Logistics", status: "PLANNED", description: "Parcel and global logistics services", capabilities: ["Parcel", "Global"] },
      { id: "DHL_FEDEX", name: "DHL / FedEx", status: "PLANNED", description: "Future international express adapters", capabilities: ["Express", "International"] },
    ];
  }

  list() {
    return this.prisma.deliveryShipment.findMany({
      include: shipmentInclude,
      orderBy: { createdAt: "desc" },
      take: 200,
    });
  }

  async create(input: CreateDeliveryDto) {
    const order = await this.prisma.salesOrder.findUnique({ where: { id: input.orderId } });
    if (!order) throw new NotFoundException("Sales order not found");
    if (order.status === "CANCELLED") throw new BadRequestException("A cancelled order cannot be shipped");

    const activeShipment = await this.prisma.deliveryShipment.findFirst({
      where: { orderId: input.orderId, status: { notIn: ["FAILED", "CANCELLED"] } },
    });
    if (activeShipment) throw new ConflictException("This order already has an active delivery");

    const days = input.service === "SAME_DAY" ? 0 : input.service === "EXPRESS" ? 1 : 3;
    const estimatedDeliveryAt = new Date();
    estimatedDeliveryAt.setDate(estimatedDeliveryAt.getDate() + days);
    estimatedDeliveryAt.setHours(input.service === "SAME_DAY" ? 20 : 18, 0, 0, 0);
    const trackingNumber = `SBOX-${new Date().toISOString().slice(2, 10).replaceAll("-", "")}-${crypto.randomUUID().slice(0, 8).toUpperCase()}`;

    const created = await this.prisma.$transaction(async (tx) => {
      const shipment = await tx.deliveryShipment.create({
        data: {
          orderId: input.orderId,
          provider: "SANDBOX",
          service: input.service,
          trackingNumber,
          estimatedDeliveryAt,
          events: { create: { status: "CREATED", description: eventDescriptions.CREATED, location: "Seoul FC" } },
        },
        include: shipmentInclude,
      });
      await tx.auditLog.create({
        data: { action: "DELIVERY_CREATED", resourceType: "DeliveryShipment", resourceId: shipment.id, after: shipment },
      });
      await tx.outboxEvent.create({
        data: { topic: "delivery.created", aggregateId: shipment.id, payload: { id: shipment.id, orderId: shipment.orderId, trackingNumber } },
      });
      return shipment;
    });
    return created;
  }

  async action(id: string, input: DeliveryActionDto) {
    const shipment = await this.prisma.deliveryShipment.findUnique({ where: { id } });
    if (!shipment) throw new NotFoundException("Delivery not found");

    let status: DeliveryStatus | undefined;
    if (input.action === "ADVANCE") status = nextStatus[shipment.status];
    if (input.action === "FAIL" && !["DELIVERED", "CANCELLED"].includes(shipment.status)) status = "FAILED";
    if (input.action === "CANCEL" && !["DELIVERED", "CANCELLED"].includes(shipment.status)) status = "CANCELLED";
    if (!status) throw new BadRequestException("This action is not available for the current delivery status");

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.deliveryShipment.update({
        where: { id },
        data: {
          status,
          events: { create: { status, description: eventDescriptions[status], location: status === "DELIVERED" ? "Recipient address" : "Sandbox network" } },
        },
        include: shipmentInclude,
      });
      await tx.auditLog.create({
        data: { action: `DELIVERY_${status}`, resourceType: "DeliveryShipment", resourceId: id, before: shipment, after: updated },
      });
      await tx.outboxEvent.create({
        data: { topic: "delivery.status-changed", aggregateId: id, payload: { id, status, trackingNumber: shipment.trackingNumber } },
      });
      return updated;
    });
  }
}
