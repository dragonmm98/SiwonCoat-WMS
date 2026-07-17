import { ApiProperty } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsDateString,
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const TASK_TYPES = [
  "RECEIVE",
  "PUTAWAY",
  "PICK",
  "PACK",
  "SHIP",
  "CYCLE_COUNT",
  "MOVE",
  "REPLENISHMENT",
] as const;

export class CreateTaskDto {
  @ApiProperty({ enum: TASK_TYPES })
  @IsIn(TASK_TYPES)
  type!: (typeof TASK_TYPES)[number];

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  priority!: number;

  @IsUUID()
  warehouseId!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  assigneeId?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  referenceType!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  referenceId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  title!: string;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  description?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  sourceLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  destinationLocation?: string;

  @IsOptional()
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  quantity?: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  unit?: string;

  @IsOptional()
  @IsDateString()
  dueAt?: string;

  @IsOptional()
  @IsString()
  @MaxLength(700)
  instructions?: string;
}
