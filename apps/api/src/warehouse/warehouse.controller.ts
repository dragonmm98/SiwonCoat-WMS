import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Patch,
  Post,
  Query,
  Version,
} from "@nestjs/common";
import { CreateWarehouseDto } from "./dto/create-warehouse.dto";
import { CreateZoneDto } from "./dto/create-zone.dto";
import { UpdateWarehouseDto } from "./dto/update-warehouse.dto";
import { UpdateOperationalSettingsDto } from "./dto/update-operational-settings.dto";
import { WarehouseService } from "./warehouse.service";

@Controller("warehouses")
export class WarehouseController {
  constructor(private readonly warehouses: WarehouseService) {}

  @Get()
  @Version("1")
  list(@Query("includeInactive") includeInactive?: string) {
    return this.warehouses.list(includeInactive === "true");
  }

  @Get("audit-log")
  @Version("1")
  auditLog(@Query("limit") limit?: string) {
    return this.warehouses.auditLog(limit ? Number(limit) : 40);
  }

  @Get(":warehouseId/operational-settings")
  @Version("1")
  operationalSettings(
    @Param("warehouseId", ParseUUIDPipe) warehouseId: string,
  ) {
    return this.warehouses.operationalSettings(warehouseId);
  }

  @Patch(":warehouseId/operational-settings")
  @Version("1")
  updateOperationalSettings(
    @Param("warehouseId", ParseUUIDPipe) warehouseId: string,
    @Body() input: UpdateOperationalSettingsDto,
  ) {
    return this.warehouses.updateOperationalSettings(warehouseId, input.settings);
  }

  @Post()
  @Version("1")
  create(@Body() input: CreateWarehouseDto) {
    return this.warehouses.create(input);
  }

  @Patch(":warehouseId")
  @Version("1")
  update(
    @Param("warehouseId", ParseUUIDPipe) warehouseId: string,
    @Body() input: UpdateWarehouseDto,
  ) {
    return this.warehouses.update(warehouseId, input);
  }

  @Post(":warehouseId/zones")
  @Version("1")
  createZone(
    @Param("warehouseId", ParseUUIDPipe) warehouseId: string,
    @Body() input: CreateZoneDto,
  ) {
    return this.warehouses.createZone(warehouseId, input);
  }
}
