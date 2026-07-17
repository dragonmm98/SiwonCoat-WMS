import type { Metadata } from "next";
import { OutboundOrders } from "./outbound-orders";

export const metadata: Metadata = { title: "Outbound" };

export default function OutboundPage() {
  return <OutboundOrders />;
}
