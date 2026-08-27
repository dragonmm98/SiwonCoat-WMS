import type { Metadata } from "next";
import { ProductionDashboard } from "./production-dashboard";

export const metadata: Metadata = { title: "Production & Batches" };

export default function CatalogPage() {
  return <ProductionDashboard />;
}
