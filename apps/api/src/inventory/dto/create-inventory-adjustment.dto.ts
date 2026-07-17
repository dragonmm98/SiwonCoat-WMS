import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from "class-validator";

export class CreateInventoryAdjustmentDto {
  @IsUUID()
  balanceId!: string;

  @ApiProperty({ enum: ["INCREASE", "DECREASE"] })
  @IsIn(["INCREASE", "DECREASE"])
  direction!: "INCREASE" | "DECREASE";

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  reason!: string;

  @IsString()
  @MaxLength(500)
  notes!: string;

  @IsUUID()
  idempotencyKey!: string;
}
