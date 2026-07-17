import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { AddBarcodeDto } from "./dto/add-barcode.dto";
import { CreateSkuDto } from "./dto/create-sku.dto";
import {
  ImportDuplicateStrategy,
  ImportSkusDto,
} from "./dto/import-skus.dto";

@Injectable()
export class CatalogService {
  constructor(private readonly prisma: PrismaService) {}

  list(query?: string) {
    return this.prisma.sku.findMany({
      where: query
        ? {
            OR: [
              { code: { contains: query, mode: "insensitive" } },
              { name: { contains: query, mode: "insensitive" } },
              { barcodes: { some: { value: query } } },
            ],
          }
        : undefined,
      include: {
        barcodes: true,
        balances: {
          select: { onHandQty: true, reservedQty: true, status: true },
        },
      },
      orderBy: [{ createdAt: "desc" }, { code: "asc" }],
      take: 1000,
    });
  }

  async detail(id: string) {
    const sku = await this.prisma.sku.findUnique({
      where: { id },
      include: {
        barcodes: { orderBy: [{ primary: "desc" }, { createdAt: "asc" }] },
        balances: {
          include: {
            warehouse: true,
            location: { include: { zone: true } },
          },
          orderBy: { updatedAt: "desc" },
        },
        purchaseOrderLines: {
          include: {
            purchaseOrder: {
              select: { id: true, orderNumber: true, status: true, expectedAt: true },
            },
          },
          orderBy: { id: "desc" },
          take: 20,
        },
        orderLines: {
          include: {
            order: {
              select: { id: true, orderNumber: true, status: true, createdAt: true },
            },
          },
          orderBy: { id: "desc" },
          take: 20,
        },
      },
    });
    if (!sku) throw new NotFoundException("Product not found");
    return sku;
  }

  async create(input: CreateSkuDto) {
    this.validateSku(input);
    const { barcodes = [], ...skuData } = input;

    try {
      return await this.prisma.$transaction(async (tx) => {
        const sku = await tx.sku.create({
          data: {
            ...skuData,
            barcodes: { create: barcodes },
          },
          include: { barcodes: true },
        });
        await tx.auditLog.create({
          data: {
            action: "SKU_CREATED",
            resourceType: "Sku",
            resourceId: sku.id,
            after: sku,
          },
        });
        await tx.outboxEvent.create({
          data: {
            topic: "sku.created",
            aggregateId: sku.id,
            payload: { id: sku.id, code: sku.code, active: sku.active },
          },
        });
        return sku;
      });
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException("SKU code or barcode already exists");
      throw error;
    }
  }

  async import(input: ImportSkusDto) {
    input.items.forEach((item) => this.validateSku(item));

    const duplicateCodes = this.duplicates(input.items.map((item) => item.code));
    const duplicateBarcodes = this.duplicates(
      input.items.flatMap((item) =>
        (item.barcodes ?? []).map((barcode) => barcode.value),
      ),
    );
    if (duplicateCodes.length || duplicateBarcodes.length) {
      throw new BadRequestException({
        message: "The import contains duplicate SKU codes or barcode values",
        duplicateCodes,
        duplicateBarcodes,
      });
    }

    const codes = input.items.map((item) => item.code);
    const barcodeValues = input.items.flatMap((item) =>
      (item.barcodes ?? []).map((barcode) => barcode.value),
    );
    const [existingSkus, existingBarcodes] = await Promise.all([
      this.prisma.sku.findMany({
        where: { code: { in: codes } },
        select: { code: true },
      }),
      barcodeValues.length
        ? this.prisma.barcode.findMany({
            where: { value: { in: barcodeValues } },
            select: { value: true },
          })
        : Promise.resolve([]),
    ]);
    const existingCodes = new Set(existingSkus.map((sku) => sku.code));
    const existingBarcodeValues = new Set(
      existingBarcodes.map((barcode) => barcode.value),
    );
    const skipped = input.items
      .map((item) => {
        const reasons: string[] = [];
        if (existingCodes.has(item.code)) reasons.push("SKU code already exists");
        const barcode = (item.barcodes ?? []).find((candidate) =>
          existingBarcodeValues.has(candidate.value),
        );
        if (barcode) reasons.push(`Barcode ${barcode.value} already exists`);
        return reasons.length ? { code: item.code, reasons } : null;
      })
      .filter((item): item is { code: string; reasons: string[] } => Boolean(item));

    if (
      skipped.length &&
      (input.duplicateStrategy ?? ImportDuplicateStrategy.SKIP) ===
        ImportDuplicateStrategy.FAIL
    ) {
      throw new ConflictException({
        message: "Existing products conflict with this import",
        skipped,
      });
    }

    const skippedCodes = new Set(skipped.map((item) => item.code));
    const accepted = input.items.filter((item) => !skippedCodes.has(item.code));

    try {
      const created = await this.prisma.$transaction(async (tx) => {
        const products = [];
        for (const item of accepted) {
          const { barcodes = [], ...skuData } = item;
          const sku = await tx.sku.create({
            data: { ...skuData, barcodes: { create: barcodes } },
            include: { barcodes: true },
          });
          await tx.auditLog.create({
            data: {
              action: "SKU_IMPORTED",
              resourceType: "Sku",
              resourceId: sku.id,
              after: sku,
            },
          });
          await tx.outboxEvent.create({
            data: {
              topic: "sku.created",
              aggregateId: sku.id,
              payload: { id: sku.id, code: sku.code, active: sku.active },
            },
          });
          products.push(sku);
        }
        return products;
      });
      return {
        createdCount: created.length,
        skippedCount: skipped.length,
        created: created.map(({ id, code, name }) => ({ id, code, name })),
        skipped,
      };
    } catch (error) {
      if (
        error instanceof Prisma.PrismaClientKnownRequestError &&
        error.code === "P2002"
      )
        throw new ConflictException(
          "A SKU code or barcode was created while the import was running. Review the file and try again.",
        );
      throw error;
    }
  }

  private validateSku(input: CreateSkuDto) {
    if (input.expiryTracked && input.trackingPolicy !== "LOT")
      throw new BadRequestException(
        `Expiry tracking for ${input.code} requires the LOT tracking policy`,
      );
    if ((input.barcodes?.filter((barcode) => barcode.primary).length ?? 0) > 1)
      throw new BadRequestException(
        `Only one barcode can be primary for ${input.code}`,
      );
    const barcodes = input.barcodes ?? [];
    if (new Set(barcodes.map((barcode) => barcode.value)).size !== barcodes.length)
      throw new BadRequestException(
        `Barcode values must be unique for ${input.code}`,
      );
  }

  private duplicates(values: string[]) {
    const seen = new Set<string>();
    const duplicates = new Set<string>();
    for (const value of values) {
      if (seen.has(value)) duplicates.add(value);
      seen.add(value);
    }
    return [...duplicates];
  }

  addBarcode(skuId: string, input: AddBarcodeDto) {
    return this.prisma.barcode.create({ data: { ...input, skuId } });
  }
}
