import type { Metadata } from "next";
import { SalesOrderDetails } from "./sales-order-details";

export const metadata: Metadata = { title: "Sales order details" };

export default async function SalesOrderDetailsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  return <SalesOrderDetails id={id} />;
}
