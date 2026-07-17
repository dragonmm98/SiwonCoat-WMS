import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";

const orderInclude = {
  lines: {
    include: {
      sku: {
        include: {
          barcodes: true,
          balances: {
            select: { onHandQty: true, reservedQty: true, status: true },
          },
        },
      },
    },
    orderBy: { id: "asc" as const },
  },
} satisfies Prisma.SalesOrderInclude;

@Injectable()
export class OutboundService {
  constructor(private readonly prisma: PrismaService) {}

  listSalesOrders() {
    return this.prisma.salesOrder.findMany({
      include: orderInclude,
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getSalesOrder(id: string) {
    const order = await this.prisma.salesOrder.findUnique({
      where: { id },
      include: orderInclude,
    });
    if (!order) throw new NotFoundException("Sales order not found");
    return order;
  }

  async createSalesOrder(input: CreateSalesOrderDto) {
    if (!(["DRAFT", "READY_TO_ALLOCATE"] as string[]).includes(input.status))
      throw new BadRequestException(
        "A new sales order must be DRAFT or READY_TO_ALLOCATE",
      );
    const skuIds = input.lines.map((line) => line.skuId);
    if (new Set(skuIds).size !== skuIds.length)
      throw new BadRequestException("Each SKU can appear only once per order");

    const skuCount = await this.prisma.sku.count({
      where: { id: { in: skuIds }, active: true },
    });
    if (skuCount !== skuIds.length)
      throw new BadRequestException("One or more SKUs are invalid or inactive");

    try {
      return await this.prisma.$transaction(async (tx) => {
        const order = await tx.salesOrder.create({
          data: {
            orderNumber: input.orderNumber,
            status: input.status,
            priority: input.priority,
            recipient: input.recipient,
            address: {
              line1: input.address.line1,
              line2: input.address.line2 ?? null,
              city: input.address.city,
              postalCode: input.address.postalCode,
              country: input.address.country,
              phone: input.address.phone,
              shippingMethod: input.address.shippingMethod,
              instructions: input.address.instructions ?? null,
            },
            lines: {
              create: input.lines.map((line) => ({
                skuId: line.skuId,
                orderedQty: line.orderedQty,
              })),
            },
          },
          include: orderInclude,
        });
        await tx.auditLog.create({
          data: {
            action: "SALES_ORDER_CREATED",
            resourceType: "SalesOrder",
            resourceId: order.id,
            after: order,
          },
        });
        await tx.outboxEvent.create({
          data: {
            topic: "sales-order.created",
            aggregateId: order.id,
            payload: {
              id: order.id,
              orderNumber: order.orderNumber,
              status: order.status,
            },
          },
        });
        return order;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException("Sales order number already exists");
      throw error;
    }
  }
}
