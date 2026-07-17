import { ApiProperty } from "@nestjs/swagger";
import { IsIn } from "class-validator";

const DELIVERY_ACTIONS = ["ADVANCE", "FAIL", "CANCEL"] as const;

export class DeliveryActionDto {
  @ApiProperty({ enum: DELIVERY_ACTIONS })
  @IsIn(DELIVERY_ACTIONS)
  action!: (typeof DELIVERY_ACTIONS)[number];
}
