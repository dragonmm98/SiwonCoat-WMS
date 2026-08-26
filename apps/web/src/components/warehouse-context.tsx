"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { API_URL } from "@/lib/api-url";

export type Warehouse = {
  id: string;
  code: string;
  name: string;
  timezone: string;
  address: string | null;
  latitude: number | null;
  longitude: number | null;
  active: boolean;
  zones: { id: string; locations: { id: string }[] }[];
  operationalSettings?: {
    users?: { id: string; name: string; role: string; email: string; active: boolean }[];
  };
};

type WarehouseContextValue = {
  warehouses: Warehouse[];
  selectedWarehouse: Warehouse | null;
  loading: boolean;
  selectWarehouse: (warehouse: Warehouse) => void;
  refreshWarehouses: () => Promise<Warehouse[]>;
};

const STORAGE_KEY = "jably-selected-warehouse";
const WarehouseContext = createContext<WarehouseContextValue | null>(null);

const LOCAL_FALLBACK_WAREHOUSE: Warehouse = {
  id: "siwoncoat-local",
  code: "SEOUL-01",
  name: "SIWONCOAT Warehouse",
  timezone: "Asia/Seoul",
  address: "Seoul, Republic of Korea",
  latitude: null,
  longitude: null,
  active: true,
  zones: [],
};

export function WarehouseProvider({ children }: { children: React.ReactNode }) {
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [selectedWarehouse, setSelectedWarehouse] = useState<Warehouse | null>(null);
  const [loading, setLoading] = useState(true);

  const refreshWarehouses = useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/warehouses`);
      if (!response.ok) throw new Error("Could not load warehouses");
      const body = (await response.json()) as Warehouse[];
      setWarehouses(body);
      setSelectedWarehouse((current) => {
        const storedId = window.localStorage.getItem(STORAGE_KEY);
        const next = body.find((warehouse) => warehouse.id === current?.id)
          ?? body.find((warehouse) => warehouse.id === storedId)
          ?? body[0]
          ?? null;
        if (next) window.localStorage.setItem(STORAGE_KEY, next.id);
        else window.localStorage.removeItem(STORAGE_KEY);
        return next;
      });
      return body;
    } catch {
      // The visual demo can run independently when the optional WMS API is
      // offline. Data-backed pages will reconnect on the next manual refresh.
      const fallback = [LOCAL_FALLBACK_WAREHOUSE];
      setWarehouses(fallback);
      setSelectedWarehouse(LOCAL_FALLBACK_WAREHOUSE);
      return fallback;
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const request = window.setTimeout(() => void refreshWarehouses(), 0);
    return () => window.clearTimeout(request);
  }, [refreshWarehouses]);

  const selectWarehouse = useCallback((warehouse: Warehouse) => {
    window.localStorage.setItem(STORAGE_KEY, warehouse.id);
    setSelectedWarehouse(warehouse);
  }, []);

  const value = useMemo(() => ({ warehouses, selectedWarehouse, loading, selectWarehouse, refreshWarehouses }), [loading, refreshWarehouses, selectWarehouse, selectedWarehouse, warehouses]);
  return <WarehouseContext.Provider value={value}>{children}</WarehouseContext.Provider>;
}

export function useWarehouse() {
  const context = useContext(WarehouseContext);
  if (!context) throw new Error("useWarehouse must be used inside WarehouseProvider");
  return context;
}
