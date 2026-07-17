import { ApiProperty } from "@nestjs/swagger";
import { IsIn, IsUUID } from "class-validator";

const DELIVERY_SERVICES = ["STANDARD", "EXPRESS", "SAME_DAY"] as const;

export class CreateDeliveryDto {
  @IsUUID()
  orderId!: string;

  @ApiProperty({ enum: DELIVERY_SERVICES })
  @IsIn(DELIVERY_SERVICES)
  service!: (typeof DELIVERY_SERVICES)[number];
}
