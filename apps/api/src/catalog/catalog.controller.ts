import {
  Body,
  Controller,
  Get,
  Param,
  ParseUUIDPipe,
  Post,
  Query,
  Version,
} from "@nestjs/common";
import { CatalogService } from "./catalog.service";
import { AddBarcodeDto } from "./dto/add-barcode.dto";
import { CreateSkuDto } from "./dto/create-sku.dto";
import { ImportSkusDto } from "./dto/import-skus.dto";

@Controller("skus")
export class CatalogController {
  constructor(private readonly catalog: CatalogService) {}

  @Get()
  @Version("1")
  list(@Query("q") query?: string) {
    return this.catalog.list(query);
  }

  @Get(":id")
  @Version("1")
  detail(@Param("id", ParseUUIDPipe) id: string) {
    return this.catalog.detail(id);
  }

  @Post()
  @Version("1")
  create(@Body() input: CreateSkuDto) {
    return this.catalog.create(input);
  }

  @Post("import")
  @Version("1")
  import(@Body() input: ImportSkusDto) {
    return this.catalog.import(input);
  }

  @Post(":skuId/barcodes")
  @Version("1")
  addBarcode(
    @Param("skuId", ParseUUIDPipe) skuId: string,
    @Body() input: AddBarcodeDto,
  ) {
    return this.catalog.addBarcode(skuId, input);
  }
}
