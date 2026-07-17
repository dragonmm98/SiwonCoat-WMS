import { ConflictException, Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { CreateZoneDto } from "./dto/create-zone.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";

@Injectable()
export class WarehouseService {
  constructor(private readonly prisma: PrismaService) {}

  list(includeInactive = false) {
    return this.prisma.warehouse.findMany({
      where: includeInactive ? undefined : { active: true },
      include: {
        zones: { include: { locations: true }, orderBy: { sequence: "asc" } },
      },
      orderBy: { code: "asc" },
    });
  }

  async create(input: CreateWarehouseDto) {
    try {
      return await this.prisma.$transaction(async (tx) => {
        const warehouse = await tx.warehouse.create({ data: input });
        await tx.auditLog.create({ data: { action: "WAREHOUSE_CREATED", resourceType: "Warehouse", resourceId: warehouse.id, after: warehouse } });
        await tx.outboxEvent.create({ data: { topic: "warehouse.created", aggregateId: warehouse.id, payload: { id: warehouse.id, code: warehouse.code, active: warehouse.active } } });
        return warehouse;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ConflictException("Warehouse code already exists");
      throw error;
    }
  }

  async update(id: string, input: UpdateWarehouseDto) {
    const existing = await this.prisma.warehouse.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Warehouse not found");
    if (existing.active && input.active === false) {
      const activeCount = await this.prisma.warehouse.count({ where: { active: true } });
      if (activeCount <= 1) throw new ConflictException("At least one warehouse must remain active");
    }
    try {
      return await this.prisma.$transaction(async (tx) => {
        const warehouse = await tx.warehouse.update({ where: { id }, data: input });
        await tx.auditLog.create({ data: { action: "WAREHOUSE_UPDATED", resourceType: "Warehouse", resourceId: id, before: existing, after: warehouse } });
        await tx.outboxEvent.create({ data: { topic: "warehouse.updated", aggregateId: id, payload: { id, code: warehouse.code, active: warehouse.active } } });
        return warehouse;
      });
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") throw new ConflictException("Warehouse code already exists");
      throw error;
    }
  }

  async operationalSettings(id: string) {
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id },
      select: { operationalSettings: true },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");
    return warehouse.operationalSettings;
  }

  async updateOperationalSettings(id: string, settings: Record<string, unknown>) {
    const existing = await this.prisma.warehouse.findUnique({
      where: { id },
      select: { operationalSettings: true },
    });
    if (!existing) throw new NotFoundException("Warehouse not found");
    return this.prisma.$transaction(async (tx) => {
      const warehouse = await tx.warehouse.update({
        where: { id },
        data: { operationalSettings: settings as Prisma.InputJsonValue },
        select: { id: true, operationalSettings: true },
      });
      await tx.auditLog.create({
        data: {
          action: "OPERATIONAL_SETTINGS_UPDATED",
          resourceType: "Warehouse",
          resourceId: id,
          before: existing.operationalSettings as Prisma.InputJsonValue,
          after: warehouse.operationalSettings as Prisma.InputJsonValue,
        },
      });
      return warehouse.operationalSettings;
    });
  }

  auditLog(limit = 40) {
    const safeLimit = Number.isFinite(limit)
      ? Math.max(1, Math.min(Math.trunc(limit), 100))
      : 40;
    return this.prisma.auditLog.findMany({
      orderBy: { createdAt: "desc" },
      take: safeLimit,
    });
  }

  createZone(warehouseId: string, input: CreateZoneDto) {
    return this.prisma.zone.create({ data: { ...input, warehouseId } });
  }
}
