"use client";

import Image from "next/image";
import Link from "next/link";
import { AppNavigation } from "./app-navigation";
import { useWarehouse } from "./warehouse-context";

export function WarehouseShell({ children }: { children: React.ReactNode }) {
  const { selectedWarehouse } = useWarehouse();
  const admin = selectedWarehouse?.operationalSettings?.users?.find(
    (user) => user.active && user.role.toLowerCase().includes("admin"),
  );
  const adminName = admin?.name ?? "Warehouse Admin";
  const initials = adminName.split(/\s+/).map((part) => part[0]).join("").slice(0, 2).toUpperCase();

  return <>
    <aside className="sidebar siwon-sidebar">
      <Link className="brand siwon-brand" href="/"><Image src="/siwoncoat-logo.png" alt="Siwon Coat" width={142} height={78} priority /></Link>
      <AppNavigation />
      <div className="siwon-admin-card" aria-label={`Signed in as ${adminName}`}>
        <span>{initials}</span>
        <div><strong>{adminName}</strong><small>{admin?.role ?? "Administrator"}</small></div>
        <b aria-hidden="true">›</b>
      </div>
      <p className="sidebar-copyright">© SIWONCOAT Co., Ltd.<br />All rights reserved.</p>
    </aside>
    <main className="app-main">{children}</main>
  </>;
}
