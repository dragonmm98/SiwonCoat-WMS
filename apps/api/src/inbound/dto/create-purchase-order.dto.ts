import { ApiProperty } from "@nestjs/swagger";
import { PurchaseOrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
  IsDateString,
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from "class-validator";

export class CreatePurchaseOrderLineDto {
  @ApiProperty()
  @IsUUID()
  skuId!: string;

  @ApiProperty({ example: 24 })
  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  expectedQty!: number;

  @IsOptional()
  @IsString()
  @MaxLength(12)
  unit?: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  notes?: string;
}

export class CreatePurchaseOrderDto {
  @ApiProperty({ example: "PO-260714-001" })
  @IsString()
  @Matches(/^PO-[A-Z0-9-]{3,30}$/)
  orderNumber!: string;

  @IsUUID()
  warehouseId!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  supplierName!: string;

  @IsOptional()
  @IsString()
  @MaxLength(80)
  supplierReference?: string;

  @IsDateString()
  expectedAt!: string;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  receivingDock?: string;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  priority!: number;

  @IsEnum(PurchaseOrderStatus)
  status!: PurchaseOrderStatus;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  notes?: string;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreatePurchaseOrderLineDto)
  lines!: CreatePurchaseOrderLineDto[];
}
