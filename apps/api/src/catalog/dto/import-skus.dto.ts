import { Type } from "class-transformer";
import {
  ArrayMaxSize,
  ArrayMinSize,
  IsArray,
  IsEnum,
  IsOptional,
  ValidateNested,
} from "class-validator";
import { CreateSkuDto } from "./create-sku.dto";

export enum ImportDuplicateStrategy {
  SKIP = "SKIP",
  FAIL = "FAIL",
}

export class ImportSkusDto {
  @IsArray()
  @ArrayMinSize(1)
  @ArrayMaxSize(1000)
  @ValidateNested({ each: true })
  @Type(() => CreateSkuDto)
  items!: CreateSkuDto[];

  @IsOptional()
  @IsEnum(ImportDuplicateStrategy)
  duplicateStrategy?: ImportDuplicateStrategy;
}
