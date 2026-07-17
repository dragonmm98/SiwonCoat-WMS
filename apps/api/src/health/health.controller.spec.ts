import { PrismaService } from "../prisma/prisma.service";
import { HealthController } from "./health.controller";

describe("HealthController", () => {
  it("reports liveness without external dependencies", () => {
    const controller = new HealthController({} as PrismaService);

    expect(controller.liveness()).toEqual({
      status: "ok",
      timestamp: expect.any(String) as string,
    });
  });

  it("checks PostgreSQL before reporting readiness", async () => {
    const queryRaw = jest.fn().mockResolvedValue([{ "?column?": 1 }]);
    const prisma = { $queryRaw: queryRaw } as unknown as PrismaService;
    const controller = new HealthController(prisma);

    await expect(controller.readiness()).resolves.toEqual({
      status: "ready",
      timestamp: expect.any(String) as string,
    });
    expect(queryRaw).toHaveBeenCalledTimes(1);
  });
});
