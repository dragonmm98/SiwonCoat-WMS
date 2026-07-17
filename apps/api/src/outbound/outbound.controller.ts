import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Version,
} from "@nestjs/common";
import { CreateSalesOrderDto } from "./dto/create-sales-order.dto";
import { OutboundService } from "./outbound.service";

@Controller("sales-orders")
export class OutboundController {
  constructor(private readonly outbound: OutboundService) {}

  @Get()
  @Version("1")
  list() {
    return this.outbound.listSalesOrders();
  }

  @Get(":id")
  @Version("1")
  detail(@Param("id", ParseUUIDPipe) id: string) {
    return this.outbound.getSalesOrder(id);
  }

  @Post()
  @Version("1")
  create(@Body() input: CreateSalesOrderDto) {
    return this.outbound.createSalesOrder(input);
  }
}
