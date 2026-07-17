"use client";

import { useEffect, useRef } from "react";
import type { Warehouse } from "@/components/warehouse-context";
import styles from "./warehouse-map.module.css";

type MappedWarehouse = Warehouse & { latitude: number; longitude: number };

export function WarehouseMap({
  warehouses,
  focusedWarehouseId,
  onFocusWarehouse,
}: {
  warehouses: MappedWarehouse[];
  focusedWarehouseId: string | null;
  onFocusWarehouse: (warehouseId: string) => void;
}) {
  const container = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!container.current || warehouses.length === 0) return;
    let disposed = false;
    let cleanup: () => void = () => undefined;

    void import("leaflet").then((leaflet) => {
      if (disposed || !container.current) return;
      const L = leaflet.default;
      const map = L.map(container.current, {
        scrollWheelZoom: false,
        zoomControl: true,
      });
      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution: "&copy; OpenStreetMap contributors",
        maxZoom: 19,
      }).addTo(map);

      const bounds = L.latLngBounds([]);
      let focusedMarker: L.Marker | null = null;
      for (const warehouse of warehouses) {
        const focused = warehouse.id === focusedWarehouseId;
        const marker = L.marker([warehouse.latitude, warehouse.longitude], {
          icon: L.divIcon({
            className: styles.markerShell,
            html: `<span class="${styles.marker}${focused ? ` ${styles.focusedMarker}` : ""}"><i></i></span>`,
            iconSize: [34, 42],
            iconAnchor: [17, 40],
            popupAnchor: [0, -38],
          }),
          title: `${warehouse.code} · ${warehouse.name}`,
        }).addTo(map);

        const popup = document.createElement("div");
        popup.className = styles.popup;
        const code = document.createElement("strong");
        code.textContent = warehouse.code;
        const name = document.createElement("span");
        name.textContent = warehouse.name;
        const address = document.createElement("small");
        address.textContent = warehouse.address || `${warehouse.latitude}, ${warehouse.longitude}`;
        popup.append(code, name, address);
        marker.bindPopup(popup);
        if (focused) focusedMarker = marker;
        bounds.extend([warehouse.latitude, warehouse.longitude]);
      }

      if (warehouses.length === 1) {
        map.setView(bounds.getCenter(), 13);
      } else {
        map.fitBounds(bounds, { padding: [52, 52], maxZoom: 12 });
      }
      focusedMarker?.openPopup();
      window.setTimeout(() => map.invalidateSize(), 0);
      cleanup = () => {
        map.remove();
      };
    });

    return () => {
      disposed = true;
      cleanup();
    };
  }, [focusedWarehouseId, warehouses]);

  return <>
    <div className={styles.map} ref={container} />
    <div className={styles.legend}>
      {warehouses.map((warehouse) => <button className={warehouse.id === focusedWarehouseId ? styles.focusedLegend : ""} type="button" key={warehouse.id} onClick={() => onFocusWarehouse(warehouse.id)}><span>⌖</span><div><strong>{warehouse.code}</strong><small>{warehouse.name} · {warehouse.address || `${warehouse.latitude.toFixed(4)}, ${warehouse.longitude.toFixed(4)}`}</small></div></button>)}
    </div>
  </>;
}
