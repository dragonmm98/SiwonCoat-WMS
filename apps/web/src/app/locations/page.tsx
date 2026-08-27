import type { Metadata } from "next";
import { LocationDashboard } from "./location-dashboard";

export const metadata: Metadata = { title: "Locations" };

export default function LocationsPage() {
  return <LocationDashboard />;
}
