import type { Metadata } from "next";
import { CreateProductForm } from "./create-product-form";

export const metadata: Metadata = { title: "New product" };

export default function NewProductPage() {
  return <CreateProductForm />;
}
