import type { Metadata } from "next";
import { InventoryAdjustmentForm } from "./inventory-adjustment-form";

export const metadata: Metadata = { title: "New inventory adjustment" };

export default async function NewInventoryAdjustmentPage({
  searchParams,
}: {
  searchParams: Promise<{ balanceId?: string }>;
}) {
  const { balanceId } = await searchParams;
  return <InventoryAdjustmentForm initialBalanceId={balanceId ?? ""} />;
}
