import { ApiProperty } from "@nestjs/swagger";
import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Matches,
  MaxLength,
  Min,
} from "class-validator";

export class CreateZoneDto {
  @ApiProperty({ example: "A" })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/)
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: "Storage A" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @IsOptional()
  @IsInt()
  @Min(0)
  sequence?: number;
}
