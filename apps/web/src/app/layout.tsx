import type { Metadata, Viewport } from "next";
import { ServiceWorkerRegistration } from "@/components/service-worker-registration";
import { WarehouseProvider } from "@/components/warehouse-context";
import { WarehouseShell } from "@/components/warehouse-shell";
import { LanguageProvider } from "@/components/language-context";
import "leaflet/dist/leaflet.css";
import "./globals.css";

export const metadata: Metadata = {
  title: { default: "SIWONCOAT WMS", template: "%s · SIWONCOAT WMS" },
  description:
    "Fast, accurate warehouse operations from receiving to shipment.",
  manifest: "/manifest.webmanifest",
};

export const viewport: Viewport = {
  themeColor: "#062c4c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <ServiceWorkerRegistration />
        <LanguageProvider><WarehouseProvider><WarehouseShell>{children}</WarehouseShell></WarehouseProvider></LanguageProvider>
      </body>
    </html>
  );
}
