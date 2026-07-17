import type { Metadata } from "next";
import { ProductDetails } from "./product-details";

export const metadata: Metadata = { title: "Product details" };

export default async function ProductDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <ProductDetails id={id} />;
}
