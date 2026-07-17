import { ApiProperty } from "@nestjs/swagger";
import { IsBoolean, IsNotEmpty, IsNumber, IsOptional, IsString, Matches, Max, MaxLength, Min } from "class-validator";

export class CreateWarehouseDto {
  @ApiProperty({ example: "SEL-01" })
  @IsString()
  @Matches(/^[A-Z0-9-]+$/)
  @MaxLength(20)
  code!: string;

  @ApiProperty({ example: "Seoul Fulfillment Center" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(120)
  name!: string;

  @ApiProperty({ example: "Asia/Seoul", required: false })
  @IsString()
  timezone = "Asia/Seoul";

  @ApiProperty({ example: "Seoul, South Korea", required: false })
  @IsOptional()
  @IsString()
  @MaxLength(240)
  address?: string;

  @ApiProperty({ example: 37.5665, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-90)
  @Max(90)
  latitude?: number;

  @ApiProperty({ example: 126.978, required: false })
  @IsOptional()
  @IsNumber()
  @Min(-180)
  @Max(180)
  longitude?: number;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  active = true;
}
