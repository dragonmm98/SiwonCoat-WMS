import type { Metadata } from "next";
import { InboundOrders } from "./inbound-orders";

export const metadata: Metadata = { title: "Inbound" };

export default function InboundPage() {
  return <InboundOrders />;
}
