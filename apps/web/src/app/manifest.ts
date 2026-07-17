import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Jably Warehouse Management",
    short_name: "Jably WMS",
    description: "Warehouse operations from receiving to shipment",
    start_url: "/",
    display: "standalone",
    background_color: "#f4f6f3",
    theme_color: "#172a24",
    icons: [{ src: "/wms-icon.svg", sizes: "any", type: "image/svg+xml" }],
  };
}
