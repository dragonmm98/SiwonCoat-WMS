import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateInventoryAdjustmentDto } from "./dto/create-inventory-adjustment.dto";

const balanceInclude = {
  warehouse: true,
  location: { include: { zone: true } },
  sku: { include: { barcodes: true } },
} satisfies Prisma.InventoryBalanceInclude;

@Injectable()
export class InventoryService {
  constructor(private readonly prisma: PrismaService) {}

  listBalances() {
    return this.prisma.inventoryBalance.findMany({
      include: balanceInclude,
      orderBy: [{ updatedAt: "desc" }, { id: "asc" }],
      take: 200,
    });
  }

  async getBalance(id: string) {
    const balance = await this.prisma.inventoryBalance.findUnique({
      where: { id },
      include: balanceInclude,
    });
    if (!balance) throw new NotFoundException("Inventory balance not found");

    const transactions = await this.prisma.inventoryTransaction.findMany({
      where: { referenceType: "InventoryBalance", referenceId: id },
      orderBy: { occurredAt: "desc" },
      take: 50,
    });
    return { ...balance, transactions };
  }

  async createAdjustment(input: CreateInventoryAdjustmentDto) {
    const current = await this.prisma.inventoryBalance.findUnique({
      where: { id: input.balanceId },
      include: balanceInclude,
    });
    if (!current) throw new NotFoundException("Inventory balance not found");

    const quantity = new Prisma.Decimal(input.quantity);
    const decrease = input.direction === "DECREASE";
    const resultingOnHand = decrease
      ? current.onHandQty.minus(quantity)
      : current.onHandQty.plus(quantity);
    if (resultingOnHand.lt(current.reservedQty))
      throw new BadRequestException(
        "Adjustment cannot reduce on-hand quantity below reserved quantity",
      );

    try {
      await this.prisma.$transaction(async (tx) => {
        const updated = await tx.inventoryBalance.updateMany({
          where: { id: current.id, version: current.version },
          data: {
            onHandQty: resultingOnHand,
            version: { increment: 1 },
          },
        });
        if (updated.count !== 1)
          throw new ConflictException(
            "Inventory changed while this adjustment was being applied. Try again.",
          );

        const transaction = await tx.inventoryTransaction.create({
          data: {
            type: "ADJUSTMENT",
            skuId: current.skuId,
            fromLocationId: decrease ? current.locationId : null,
            toLocationId: decrease ? null : current.locationId,
            lotNumber: current.lotNumber,
            quantity,
            referenceType: "InventoryBalance",
            referenceId: current.id,
            idempotencyKey: input.idempotencyKey,
            reason: `${input.direction}: ${input.reason}${input.notes ? ` — ${input.notes}` : ""}`,
          },
        });
        await tx.auditLog.create({
          data: {
            action: "INVENTORY_ADJUSTED",
            resourceType: "InventoryBalance",
            resourceId: current.id,
            before: current,
            after: {
              onHandQty: resultingOnHand.toString(),
              direction: input.direction,
              quantity: quantity.toString(),
              reason: input.reason,
              transactionId: transaction.id,
            },
          },
        });
        await tx.outboxEvent.create({
          data: {
            topic: "inventory.adjusted",
            aggregateId: current.id,
            payload: {
              balanceId: current.id,
              skuId: current.skuId,
              direction: input.direction,
              quantity: quantity.toString(),
              onHandQty: resultingOnHand.toString(),
            },
          },
        });
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException("This adjustment has already been applied");
      throw error;
    }

    return this.getBalance(current.id);
  }
}
