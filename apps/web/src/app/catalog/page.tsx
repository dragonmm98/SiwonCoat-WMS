import type { Metadata } from "next";
import { ProductCatalog } from "./product-catalog";

export const metadata: Metadata = { title: "Catalog" };

export default function CatalogPage() {
  return <ProductCatalog />;
}
