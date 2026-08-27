"use client";

import { useEffect, useMemo, useState } from "react";
import { OperationsPage } from "@/components/operations-page";
import { API_URL } from "@/lib/api-url";

type PurchaseOrder = {
  id: string;
  orderNumber: string;
  supplierName: string;
  expectedAt: string;
  receivingDock: string | null;
  status: string;
  lines: { expectedQty: string; receivedQty: string }[];
};

function number(value: number) {
  return value.toLocaleString(undefined, { maximumFractionDigits: 3 });
}

function statusLabel(value: string) {
  return value
    .toLowerCase()
    .replaceAll("_", " ")
    .replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function InboundOrders() {
  const [orders, setOrders] = useState<PurchaseOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    async function loadOrders() {
      try {
        const response = await fetch(`${API_URL}/purchase-orders`);
        if (!response.ok) throw new Error("Could not load purchase orders.");
        const body = (await response.json()) as PurchaseOrder[];
        if (active) setOrders(body);
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
    void loadOrders();
    return () => {
      active = false;
    };
  }, []);

  const totals = useMemo(() => {
    const expected = orders.reduce(
      (sum, order) =>
        sum + order.lines.reduce((lineSum, line) => lineSum + Number(line.expectedQty), 0),
      0,
    );
    const received = orders.reduce(
      (sum, order) =>
        sum + order.lines.reduce((lineSum, line) => lineSum + Number(line.receivedQty), 0),
      0,
    );
    const open = orders.filter((order) =>
      ["OPEN", "PARTIALLY_RECEIVED"].includes(order.status),
    ).length;
    const complete = orders.filter((order) =>
      ["RECEIVED", "CLOSED"].includes(order.status),
    ).length;
    return { expected, received, open, complete };
  }, [orders]);

  return (
    <OperationsPage
      eyebrow="Inbound operations"
      title="Receiving & putaway"
      description="Track purchase orders from dock arrival through storage."
      action="New purchase order"
      actionHref="/inbound/purchase-orders/new"
      scannerHref="/scan"
      sectionTitle="Expected receipts"
      columns={[
        "Purchase order",
        "Supplier",
        "Expected",
        "Dock / owner",
        "Status",
      ]}
      metrics={[
        {
          label: "Expected units",
          value: loading ? "—" : number(totals.expected),
          detail: `${orders.length} purchase order${orders.length === 1 ? "" : "s"}`,
          icon: (
            <svg viewBox="0 0 24 24">
              <path d="M3 7h11v10H3zM14 10h4l3 3v4h-7z" />
              <circle cx="7" cy="18" r="2" />
              <circle cx="18" cy="18" r="2" />
              <path d="M7 4v6M4.5 7.5 7 10l2.5-2.5" />
            </svg>
          ),
        },
        {
          label: "Received units",
          value: loading ? "—" : number(totals.received),
          detail: totals.expected
            ? `${Math.round((totals.received / totals.expected) * 100)}% complete`
            : "No receipts yet",
          icon: (
            <svg viewBox="0 0 24 24">
              <path d="M4 10h16v10H4zM8 4h8M12 4v11" />
              <path d="m8.5 11.5 3.5 3.5 3.5-3.5" />
            </svg>
          ),
        },
        {
          label: "Open orders",
          value: loading ? "—" : number(totals.open),
          detail: `${number(totals.expected - totals.received)} units remaining`,
          icon: (
            <svg viewBox="0 0 24 24">
              <rect x="5" y="4" width="14" height="17" rx="2" />
              <path d="M9 4.5V3h6v1.5M8.5 10h7M8.5 14h5" />
            </svg>
          ),
        },
        {
          label: "Completed orders",
          value: loading ? "—" : number(totals.complete),
          detail: "Received or closed",
          icon: (
            <svg viewBox="0 0 24 24">
              <circle cx="12" cy="12" r="9" />
              <path d="m8 12 2.6 2.6L16.5 9" />
            </svg>
          ),
        },
      ]}
      rows={orders.map((order) => {
        const units = order.lines.reduce(
          (sum, line) => sum + Number(line.expectedQty),
          0,
        );
        return {
          id: order.orderNumber,
          primary: order.supplierName,
          secondary: `${new Intl.DateTimeFormat("en", { dateStyle: "medium" }).format(new Date(order.expectedAt))} · ${number(units)} units · ${order.lines.length} SKU${order.lines.length === 1 ? "" : "s"}`,
          owner: order.receivingDock || "Unassigned",
          status: statusLabel(order.status),
          href: `/inbound/purchase-orders/${order.id}`,
        };
      })}
      emptyMessage={
        loading
          ? "Loading purchase orders…"
          : error || "No purchase orders have been created yet."
      }
    />
  );
}
