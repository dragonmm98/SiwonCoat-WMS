import type { Metadata } from "next";
import { InventoryBalances } from "./inventory-balances";

export const metadata: Metadata = { title: "Inventory" };

export default function InventoryPage() {
  return <InventoryBalances />;
}
