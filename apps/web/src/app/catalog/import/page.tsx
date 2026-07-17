import type { Metadata } from "next";
import { ProductImport } from "./product-import";

export const metadata: Metadata = { title: "Import products" };

export default function ImportProductsPage() {
  return <ProductImport />;
}
