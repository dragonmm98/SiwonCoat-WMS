"use client";

import { useEffect, useMemo, useState } from "react";
import { OperationsPage } from "@/components/operations-page";
import { API_URL } from "@/lib/api-url";

type Balance = {
  id: string;
  lotNumber: string;
  status: string;
  onHandQty: string;
  reservedQty: string;
  location: { code: string };
  sku: { code: string; name: string };
};

function amount(value: number | string) {
  return Number(value).toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function label(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function InventoryBalances() {
  const [balances, setBalances] = useState<Balance[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function load() {
      try {
        const response = await fetch(`${API_URL}/inventory-balances`);
        if (!response.ok) throw new Error("Could not load inventory balances.");
        const body = (await response.json()) as Balance[];
        if (active) setBalances(body);
      } catch (loadError) {
        if (active)
          setError(
            loadError instanceof Error
              ? loadError.message
              : "Could not connect to the WMS API.",
          );
      } finally {
        if (active) setLoading(false);
      }
    }
    void load();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const onHand = balances.reduce(
      (sum, balance) => sum + Number(balance.onHandQty),
      0,
    );
    const reserved = balances.reduce(
      (sum, balance) => sum + Number(balance.reservedQty),
      0,
    );
    const quarantined = balances
      .filter((balance) => balance.status === "QUARANTINED")
      .reduce((sum, balance) => sum + Number(balance.onHandQty), 0);
    return { onHand, reserved, available: onHand - reserved, quarantined };
  }, [balances]);

  return (
    <OperationsPage
      eyebrow="Inventory control"
      title="Inventory"
      description="Search balances by SKU, barcode, lot, or physical location."
      action="New adjustment"
      actionHref="/inventory/adjustments/new"
      sectionTitle="Inventory balances"
      columns={["SKU", "Product", "Location / lot", "Quantity", "Status"]}
      metrics={[
        {
          label: "On-hand units",
          value: loading ? "—" : amount(totals.onHand),
          detail: `${balances.length} balance${balances.length === 1 ? "" : "s"}`,
          icon: (
            <svg viewBox="0 0 24 24">
              <path d="m4 7 8-4 8 4-8 4-8-4Z" />
              <path d="M4 7v10l8 4 8-4V7M12 11v10" />
            </svg>
          ),
        },
        {
          label: "Available",
          value: loading ? "—" : amount(totals.available),
          detail: totals.onHand
            ? `${Math.round((totals.available / totals.onHand) * 100)}% usable`
            : "No stock",
          icon: (
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.6 2.6L16.5 9" />
            </svg>
          ),
        },
        {
          label: "Reserved",
          value: loading ? "—" : amount(totals.reserved),
          detail: "Allocated to orders",
          icon: (
            <svg viewBox="0 0 24 24">
              <rect x="5" y="8" width="14" height="12" rx="2" />
              <path d="M8 8V6a4 4 0 0 1 8 0v2M12 12v4" />
            </svg>
          ),
        },
        {
          label: "Quarantined",
          value: loading ? "—" : amount(totals.quarantined),
          detail: "Unavailable stock",
          icon: (
            <svg viewBox="0 0 24 24">
              <path d="M12 3 2.8 19h18.4L12 3Z" />
              <path d="M12 9v4M12 16.5v.1" />
            </svg>
          ),
        },
      ]}
      rows={balances.map((balance) => ({
        id: balance.sku.code,
        primary: balance.sku.name,
        secondary: `${balance.location.code} · ${balance.lotNumber || "No lot"}`,
        owner: `${amount(balance.onHandQty)} on hand · ${amount(balance.reservedQty)} reserved`,
        status: label(balance.status),
        href: `/inventory/${balance.id}`,
      }))}
      emptyMessage={
        loading ? "Loading inventory…" : error || "No inventory balances found."
      }
    />
  );
}
