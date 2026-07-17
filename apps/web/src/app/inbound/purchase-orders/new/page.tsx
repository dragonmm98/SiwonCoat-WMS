import type { Metadata } from "next";
import { PurchaseOrderForm } from "./purchase-order-form";

export const metadata: Metadata = { title: "New purchase order" };

export default function NewPurchaseOrderPage() {
  const now = new Date();
  const date = [
    String(now.getFullYear()).slice(-2),
    String(now.getMonth() + 1).padStart(2, "0"),
    String(now.getDate()).padStart(2, "0"),
  ].join("");
  const time = [
    String(now.getHours()).padStart(2, "0"),
    String(now.getMinutes()).padStart(2, "0"),
    String(now.getSeconds()).padStart(2, "0"),
  ].join("");
  const expected = new Date(now);
  expected.setDate(expected.getDate() + 1);
  const expectedDate = [
    String(expected.getFullYear()),
    String(expected.getMonth() + 1).padStart(2, "0"),
    String(expected.getDate()).padStart(2, "0"),
  ].join("-");

  return (
    <PurchaseOrderForm
      initialOrderNumber={`PO-${date}-${time}`}
      initialExpectedAt={expectedDate}
    />
  );
}
