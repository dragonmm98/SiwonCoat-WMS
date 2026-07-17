import { ApiProperty } from "@nestjs/swagger";
import { IsObject } from "class-validator";

export class UpdateOperationalSettingsDto {
  @ApiProperty({ type: "object", additionalProperties: true })
  @IsObject()
  settings!: Record<string, unknown>;
}
