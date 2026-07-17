import { ApiProperty } from "@nestjs/swagger";
import { OrderStatus } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMinSize,
  IsArray,
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

export class SalesOrderAddressDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(180)
  line1!: string;

  @IsOptional()
  @IsString()
  @MaxLength(180)
  line2?: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  city!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(30)
  postalCode!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  country!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(40)
  phone!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  shippingMethod!: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  instructions?: string;
}

export class CreateSalesOrderLineDto {
  @IsUUID()
  skuId!: string;

  @Type(() => Number)
  @IsNumber({ maxDecimalPlaces: 3 })
  @Min(0.001)
  orderedQty!: number;
}

export class CreateSalesOrderDto {
  @ApiProperty({ example: "SO-260714-001" })
  @IsString()
  @Matches(/^SO-[A-Z0-9-]{3,30}$/)
  orderNumber!: string;

  @IsEnum(OrderStatus)
  status!: OrderStatus;

  @Type(() => Number)
  @IsInt()
  @Min(0)
  @Max(3)
  priority!: number;

  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  recipient!: string;

  @ValidateNested()
  @Type(() => SalesOrderAddressDto)
  address!: SalesOrderAddressDto;

  @IsArray()
  @ArrayMinSize(1)
  @ValidateNested({ each: true })
  @Type(() => CreateSalesOrderLineDto)
  lines!: CreateSalesOrderLineDto[];
}
