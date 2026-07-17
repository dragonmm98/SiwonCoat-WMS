import type { Metadata } from "next";
import { DeliveryDashboard } from "./delivery-dashboard";

export const metadata: Metadata = { title: "Deliveries" };

export default function DeliveriesPage() {
  return <DeliveryDashboard />;
}
