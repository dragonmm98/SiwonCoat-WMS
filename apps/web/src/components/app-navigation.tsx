"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const navigation = [
  ["▦", "Overview", "/"],
  ["⇩", "Inbound", "/inbound"],
  ["□", "Inventory", "/inventory"],
  ["⇧", "Outbound", "/outbound"],
  ["◇", "Deliveries", "/deliveries"],
  ["✓", "Tasks", "/tasks"],
  ["⌁", "Catalog", "/catalog"],
] as const;

export function AppNavigation() {
  const pathname = usePathname();

  return (
    <nav>
      {navigation.map(([icon, label, href]) => {
        const active =
          href === "/" ? pathname === "/" : pathname.startsWith(href);
        return (
          <Link className={active ? "active" : ""} href={href} key={label}>
            <span>{icon}</span>
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
