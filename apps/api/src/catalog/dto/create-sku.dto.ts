import { ApiProperty } from "@nestjs/swagger";
import { TrackingPolicy } from "@prisma/client";
import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  IsArray,
  IsBoolean,
  IsEnum,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
  MinLength,
  ValidateNested,
} from "class-validator";

export class CreateSkuBarcodeDto {
  @IsString()
  @MinLength(3)
  @MaxLength(100)
  value!: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  symbology?: string;

  @IsOptional()
  @IsBoolean()
  primary?: boolean;
}

export class CreateSkuDto {
  @ApiProperty({ example: "SKU-001" })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/)
  @MaxLength(40)
  code!: string;

  @ApiProperty({ example: "Demo Product" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(160)
  name!: string;

  @IsOptional()
  @IsString()
  @MaxLength(1000)
  description?: string;

  @IsOptional()
  @IsEnum(TrackingPolicy)
  trackingPolicy?: TrackingPolicy;

  @IsOptional()
  @IsBoolean()
  expiryTracked?: boolean;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  weightKg?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  lengthCm?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  widthCm?: number;

  @IsOptional()
  @Type(() => Number)
  @Min(0)
  heightCm?: number;

  @IsOptional()
  @IsBoolean()
  active?: boolean;

  @IsOptional()
  @IsArray()
  @ArrayMaxSize(20)
  @ValidateNested({ each: true })
  @Type(() => CreateSkuBarcodeDto)
  barcodes?: CreateSkuBarcodeDto[];
}
