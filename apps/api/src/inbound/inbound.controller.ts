import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Version,
} from "@nestjs/common";
import { CreatePurchaseOrderDto } from "./dto/create-purchase-order.dto";
import { InboundService } from "./inbound.service";

@Controller("purchase-orders")
export class InboundController {
  constructor(private readonly inbound: InboundService) {}

  @Get()
  @Version("1")
  list() {
    return this.inbound.listPurchaseOrders();
  }

  @Get(":id")
  @Version("1")
  detail(@Param("id", new ParseUUIDPipe()) id: string) {
    return this.inbound.getPurchaseOrder(id);
  }

  @Post()
  @Version("1")
  create(@Body() input: CreatePurchaseOrderDto) {
    return this.inbound.createPurchaseOrder(input);
  }
}
