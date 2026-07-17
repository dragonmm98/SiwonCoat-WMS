import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Version,
} from "@nestjs/common";
import { CreateInventoryAdjustmentDto } from "./dto/create-inventory-adjustment.dto";
import { InventoryService } from "./inventory.service";

@Controller()
export class InventoryController {
  constructor(private readonly inventory: InventoryService) {}

  @Get("inventory-balances")
  @Version("1")
  listBalances() {
    return this.inventory.listBalances();
  }

  @Get("inventory-balances/:id")
  @Version("1")
  getBalance(@Param("id", ParseUUIDPipe) id: string) {
    return this.inventory.getBalance(id);
  }

  @Post("inventory-adjustments")
  @Version("1")
  createAdjustment(@Body() input: CreateInventoryAdjustmentDto) {
    return this.inventory.createAdjustment(input);
  }
}
