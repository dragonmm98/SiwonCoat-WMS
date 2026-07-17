import type { Metadata } from "next";
import { SalesOrderForm } from "./sales-order-form";

export const metadata: Metadata = { title: "New sales order" };

export default function NewSalesOrderPage() {
  return <SalesOrderForm />;
}
