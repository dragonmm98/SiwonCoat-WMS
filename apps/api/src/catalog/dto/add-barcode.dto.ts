import { ApiProperty } from "@nestjs/swagger";
import {
  IsBoolean,
  IsOptional,
  IsString,
  MaxLength,
  MinLength,
} from "class-validator";

export class AddBarcodeDto {
  @ApiProperty({ example: "880000000001" })
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
