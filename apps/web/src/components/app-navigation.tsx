"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
const navigation=[["⌂","Overview","/"],["◇","Inventory","/inventory"],["⇩","Inbound","/inbound"],["⇧","Outbound","/outbound"],["♜","Production","/tasks"],["▤","Orders","/catalog"],["⌾","Locations","/locations"],["▥","Reports","/deliveries"],["⚙","Settings","/settings"]] as const;
export function AppNavigation(){const path=usePathname();return <nav>{navigation.map(([icon,label,href])=><Link className={(href==="/"?path==="/":path.startsWith(href))?"active":""} href={href} key={label}><span>{icon}</span>{label}</Link>)}</nav>}
