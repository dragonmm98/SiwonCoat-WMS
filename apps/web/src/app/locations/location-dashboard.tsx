"use client";

import { useMemo, useState } from "react";
import { useWarehouse } from "@/components/warehouse-context";

function title(value?: string) {
  return (value ?? "Unknown").toLowerCase().replaceAll("_", " ").replace(/(^|\s)\S/g, (letter) => letter.toUpperCase());
}

export function LocationDashboard() {
  const { selectedWarehouse, loading } = useWarehouse();
  const [query, setQuery] = useState("");
  const [zoneFilter, setZoneFilter] = useState("ALL");
  const zones = selectedWarehouse?.zones ?? [];
  const locations = useMemo(() => zones.flatMap((zone) => zone.locations.map((location) => ({ ...location, zoneCode: zone.code ?? "—", zoneName: zone.name ?? "Unassigned" }))), [zones]);
  const visible = locations.filter((location) => (zoneFilter === "ALL" || location.zoneCode === zoneFilter) && [location.code, location.barcode, location.zoneName, location.type].some((value) => value?.toLowerCase().includes(query.toLowerCase())));
  const active = locations.filter((location) => (location.status ?? "ACTIVE") === "ACTIVE").length;

  return <div className="page-stack location-page">
    <header className="page-header"><div><p className="eyebrow">WAREHOUSE TOPOLOGY</p><h1>Locations</h1><p className="subtitle">Manage zones, storage positions, receiving areas, and location barcodes.</p></div><button className="button button-primary" type="button">+ Add location</button></header>
    <section className="location-summary">
      <article><span>⌾</span><div><small>Total locations</small><strong>{loading ? "—" : locations.length}</strong><p>Configured storage points</p></div></article>
      <article><span>▦</span><div><small>Zones</small><strong>{loading ? "—" : zones.length}</strong><p>{selectedWarehouse?.name ?? "Selected warehouse"}</p></div></article>
      <article><span>✓</span><div><small>Active</small><strong>{loading ? "—" : active}</strong><p>Available for operations</p></div></article>
      <article><span>▥</span><div><small>Warehouse</small><strong className="location-code">{selectedWarehouse?.code ?? "—"}</strong><p>{selectedWarehouse?.address ?? "No address configured"}</p></div></article>
    </section>
    <section className="panel location-panel">
      <div className="panel-heading location-tools"><div><h2>Storage locations</h2><p>{selectedWarehouse?.name ?? "Current warehouse"} · {visible.length} locations shown</p></div><div><label className="location-search"><span>⌕</span><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search code or barcode" /></label><select value={zoneFilter} onChange={(event) => setZoneFilter(event.target.value)} aria-label="Filter by zone"><option value="ALL">All zones</option>{zones.map((zone) => <option value={zone.code} key={zone.id}>{zone.code} · {zone.name}</option>)}</select></div></div>
      <div className="location-table"><div className="location-table-head"><span>Location</span><span>Zone</span><span>Type</span><span>Barcode</span><span>Sequence</span><span>Status</span></div>{visible.map((location) => <article key={location.id}><div><b>{location.code ?? "—"}</b><small>{selectedWarehouse?.code}</small></div><div><b>{location.zoneCode}</b><small>{location.zoneName}</small></div><span>{title(location.type)}</span><code>{location.barcode ?? "Not assigned"}</code><span>{location.sequence ?? 0}</span><strong className="location-status">{title(location.status ?? "ACTIVE")}</strong></article>)}{!visible.length && <div className="location-empty">{loading ? "Loading locations…" : "No locations match your search."}</div>}</div>
    </section>
  </div>;
}
