import { Injectable, NotFoundException } from "@nestjs/common";
import { Prisma } from "@prisma/client";
import { PrismaService } from "../prisma/prisma.service";
import { CreateTaskDto } from "./dto/create-task.dto";

@Injectable()
export class TasksService {
  constructor(private readonly prisma: PrismaService) {}

  async list() {
    const tasks = await this.prisma.operationalTask.findMany({
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
      take: 200,
    });
    const warehouseIds = [...new Set(tasks.map((task) => task.warehouseId))];
    const warehouses = await this.prisma.warehouse.findMany({
      where: { id: { in: warehouseIds } },
      select: { id: true, code: true, name: true },
    });
    const warehouseById = new Map(
      warehouses.map((warehouse) => [warehouse.id, warehouse]),
    );
    return tasks.map((task) => ({
      ...task,
      taskNumber: `TSK-${task.id.slice(0, 8).toUpperCase()}`,
      warehouse: warehouseById.get(task.warehouseId) ?? null,
    }));
  }

  async detail(id: string) {
    const task = await this.prisma.operationalTask.findUnique({ where: { id } });
    if (!task) throw new NotFoundException("Task not found");
    const warehouse = await this.prisma.warehouse.findUnique({
      where: { id: task.warehouseId },
      select: { id: true, code: true, name: true, timezone: true },
    });
    return {
      ...task,
      taskNumber: `TSK-${task.id.slice(0, 8).toUpperCase()}`,
      warehouse,
    };
  }

  async create(input: CreateTaskDto) {
    const warehouse = await this.prisma.warehouse.findFirst({
      where: { id: input.warehouseId, active: true },
    });
    if (!warehouse) throw new NotFoundException("Warehouse not found");

    const payload: Prisma.InputJsonObject = {
      title: input.title,
      description: input.description ?? null,
      sourceLocation: input.sourceLocation ?? null,
      destinationLocation: input.destinationLocation ?? null,
      quantity: input.quantity ?? null,
      unit: input.unit ?? null,
      dueAt: input.dueAt ?? null,
      instructions: input.instructions ?? null,
    };
    const task = await this.prisma.$transaction(async (tx) => {
      const created = await tx.operationalTask.create({
        data: {
          type: input.type,
          status: input.assigneeId ? "ASSIGNED" : "OPEN",
          priority: input.priority,
          warehouseId: input.warehouseId,
          assigneeId: input.assigneeId || null,
          referenceType: input.referenceType,
          referenceId: input.referenceId,
          payload,
        },
      });
      await tx.auditLog.create({
        data: {
          action: "TASK_CREATED",
          resourceType: "OperationalTask",
          resourceId: created.id,
          after: created,
        },
      });
      await tx.outboxEvent.create({
        data: {
          topic: "task.created",
          aggregateId: created.id,
          payload: {
            id: created.id,
            type: created.type,
            status: created.status,
            priority: created.priority,
          },
        },
      });
      return created;
    });
    return this.detail(task.id);
  }
}
