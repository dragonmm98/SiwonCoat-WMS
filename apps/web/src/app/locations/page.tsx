import type { Metadata } from "next";
import { WarehouseSettings } from "../settings/warehouse-settings";

export const metadata: Metadata = { title: "Locations" };

export default function LocationsPage() {
  return <WarehouseSettings />;
}
