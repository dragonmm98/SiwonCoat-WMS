import type { Metadata } from "next";
import { WarehouseSettings } from "./warehouse-settings";

export const metadata: Metadata = { title: "Settings" };

export default function SettingsPage() {
  return <WarehouseSettings />;
}
