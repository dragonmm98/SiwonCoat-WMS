import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";

@Injectable()
export class InboundService {
  constructor(private readonly prisma: PrismaService) {}

  listPurchaseOrders() {
    return this.prisma.purchaseOrder.findMany({
      include: {
        warehouse: true,
        lines: { include: { sku: { include: { barcodes: true } } } },
      },
      orderBy: { createdAt: "desc" },
      take: 100,
    });
  }

  async getPurchaseOrder(id: string) {
    const purchaseOrder = await this.prisma.purchaseOrder.findUnique({
      where: { id },
      include: {
        warehouse: true,
        lines: {
          include: { sku: { include: { barcodes: true } } },
          orderBy: { id: "asc" },
        },
      },
    });

    if (!purchaseOrder) throw new NotFoundException("Purchase order not found");
    return purchaseOrder;
  }

  async createPurchaseOrder(input: CreatePurchaseOrderDto) {
    if (!["DRAFT", "OPEN"].includes(input.status))
      throw new BadRequestException(
        "A new purchase order must be DRAFT or OPEN",
      );
    const skuIds = input.lines.map((line) => line.skuId);
    if (new Set(skuIds).size !== skuIds.length)
      throw new BadRequestException(
        "Each SKU can appear only once per purchase order",
      );

    const [warehouse, skuCount] = await Promise.all([
      this.prisma.warehouse.findFirst({
        where: { id: input.warehouseId, active: true },
      }),
      this.prisma.sku.count({ where: { id: { in: skuIds }, active: true } }),
    ]);
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    if (skuCount !== skuIds.length)
      throw new BadRequestException("One or more SKUs are invalid or inactive");

    try {
      return await this.prisma.$transaction(async (tx) => {
        const purchaseOrder = await tx.purchaseOrder.create({
          data: {
            orderNumber: input.orderNumber,
            warehouseId: input.warehouseId,
            supplierName: input.supplierName,
            supplierReference: input.supplierReference || null,
            expectedAt: new Date(input.expectedAt),
            receivingDock: input.receivingDock || null,
            priority: input.priority,
            status: input.status,
            notes: input.notes || null,
            lines: {
              create: input.lines.map((line) => ({
                skuId: line.skuId,
                expectedQty: line.expectedQty,
                unit: line.unit || "EA",
                notes: line.notes || null,
              })),
            },
          },
          include: { warehouse: true, lines: { include: { sku: true } } },
        });
        await tx.auditLog.create({
          data: {
            action: "PURCHASE_ORDER_CREATED",
            resourceType: "PurchaseOrder",
            resourceId: purchaseOrder.id,
            after: purchaseOrder,
          },
        });
        await tx.outboxEvent.create({
          data: {
            topic: "purchase-order.created",
            aggregateId: purchaseOrder.id,
            payload: {
              id: purchaseOrder.id,
              orderNumber: purchaseOrder.orderNumber,
              status: purchaseOrder.status,
            },
          },
        });
        return purchaseOrder;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException("Purchase order number already exists");
      throw error;
    }
  }
}
