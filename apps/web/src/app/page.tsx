import type { Metadata } from "next";
import { WarehouseOverview } from "./warehouse-overview";

export const metadata: Metadata = { title: "Overview" };

export default function Dashboard() {
  return <WarehouseOverview />;
}
