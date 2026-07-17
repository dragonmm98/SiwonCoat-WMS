import type { Metadata } from "next";
import { InventoryDetails } from "./inventory-details";

export const metadata: Metadata = { title: "Inventory details" };

export default async function InventoryDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <InventoryDetails id={id} />;
}
