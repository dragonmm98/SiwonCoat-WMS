import type { Metadata } from "next";
import { PurchaseOrderDetails } from "./purchase-order-details";

export const metadata: Metadata = { title: "Purchase order details" };

export default async function PurchaseOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <PurchaseOrderDetails id={id} />;
}
