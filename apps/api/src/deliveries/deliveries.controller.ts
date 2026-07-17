import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Version,
} from "@nestjs/common";
import { CreateDeliveryDto } from "./dto/create-delivery.dto";
import { DeliveryActionDto } from "./dto/delivery-action.dto";
import { DeliveriesService } from "./deliveries.service";

@Controller("deliveries")
export class DeliveriesController {
  constructor(private readonly deliveries: DeliveriesService) {}

  @Get()
  @Version("1")
  list() {
    return this.deliveries.list();
  }

  @Get("providers")
  @Version("1")
  providers() {
    return this.deliveries.providers();
  }

  @Post()
  @Version("1")
  create(@Body() input: CreateDeliveryDto) {
    return this.deliveries.create(input);
  }

  @Post(":id/actions")
  @Version("1")
  action(
    @Param("id", ParseUUIDPipe) id: string,
    @Body() input: DeliveryActionDto,
  ) {
    return this.deliveries.action(id, input);
  }
}
