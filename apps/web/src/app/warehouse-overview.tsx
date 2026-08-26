"use client";

import { useState } from "react";

const products = [["SIWONCOAT Cool",682],["SIWONCOAT Surface",396],["Primer",108],["Seashell Filler",62]] as const;
const activity = [
 ["09:42","↓","Inbound","SIWONCOAT Cool","BT-260826","+48 units","A-03","Received"],
 ["09:18","↑","Outbound","SIWONCOAT Surface","SO-1048","-25 units","B-12","Dispatched"],
 ["08:55","↓","Inbound","Seashell Filler","BT-260825","+32 units","RAW-01","Received"],
 ["08:21","▣","Production","Primer","PR-260825","+60 units","PRD-02","Completed"],
 ["07:58","↑","Outbound","SIWONCOAT Cool","SO-1047","-16 units","A-07","Dispatched"],
] as const;

export function WarehouseOverview() {
 const [language,setLanguage] = useState<"EN"|"KR">("EN");
 const [measure,setMeasure] = useState<"Units"|"Weight">("Units");
 return <div className="siwon-dashboard">
  <header className="siwon-topbar"><div className="siwon-heading"><h1>Warehouse Overview</h1><p>Real-time inventory and operations</p></div><label className="global-search"><span>⌕</span><input placeholder="Search SKU, batch or order" aria-label="Search SKU, batch or order" /></label><button className="icon-button notification" type="button" aria-label="Notifications">♧<i /></button><div className="language-toggle">{(["EN","KR"] as const).map(x=><button className={language===x?"active":""} onClick={()=>setLanguage(x)} key={x}>{x}</button>)}</div><div className="admin-chip"><b>WA</b><span>Warehouse Admin</span><i>⌄</i></div></header>
  <div className="siwon-content">
   <section className="summary-grid"><article><span className="summary-icon blue">▦</span><div><p>Total Stock</p><strong>1,248 <small>units</small></strong><em>vs yesterday</em></div><b className="rise">↑ 6.2%</b></article><article><span className="summary-icon amber">△</span><div><p>Low Stock</p><strong>8 <small>items</small></strong><em>Reorder soon</em></div></article><article><span className="summary-icon blue">⇩</span><div><p>Inbound Today</p><strong>126 <small>units</small></strong><em>Across 7 receipts</em></div></article><article><span className="summary-icon green">⇧</span><div><p>Outbound Today</p><strong>94 <small>units</small></strong><em>Across 6 shipments</em></div></article></section>
   <div className="overview-row">
    <section className="siwon-panel inventory-product"><div className="siwon-panel-title"><h2>Inventory by Product</h2><div className="measure-toggle">{(["Units","Weight"] as const).map(x=><button className={measure===x?"active":""} onClick={()=>setMeasure(x)} key={x}>{x}</button>)}</div></div><div className="product-bars">{products.map(([name,value])=><div className="product-row" key={name}><span>{name}</span><div><i style={{width:`${Math.max(10,value/6.82)}%`}} /></div><b>{measure==="Units"?value:Math.round(value*1.35)} <small>{measure==="Units"?"units":"kg"}</small></b></div>)}</div><div className="bar-axis"><span>0</span><span>200</span><span>400</span><span>600</span><span>800</span></div></section>
    <section className="siwon-panel capacity-panel"><div className="siwon-panel-title"><h2>Warehouse Capacity</h2></div><div className="capacity-body"><div className="capacity-ring"><div><strong>72<small>%</small></strong><span>Used</span></div></div><div className="zones">{[["Zone A",84,"blue"],["Zone B",61,"teal"],["Raw Materials",70,"green"]].map(([name,value,tone])=><div className="zone" key={name}><p><span>{name}</span><b>{value}%</b></p><div><i className={String(tone)} style={{width:`${value}%`}} /></div></div>)}<p className="capacity-total"><span>Total Capacity</span><b>72% / 100%</b></p></div></div></section>
   </div>
   <div className="activity-row"><section className="siwon-panel recent-panel"><div className="siwon-panel-title"><h2>Recent Inventory Activity</h2></div><div className="activity-table"><div className="activity-head"><span>Time</span><span>Type</span><span>Item</span><span>Batch / Order</span><span>Quantity</span><span>Location</span><span>Status</span></div>{activity.map(r=><div className="activity-line" key={`${r[0]}-${r[4]}`}><span>{r[0]}</span><span><i className={r[2]==="Outbound"?"out":r[2]==="Production"?"prod":"in"}>{r[1]}</i>{r[2]}</span><span>{r[3]}</span><span>{r[4]}</span><span className={r[5].startsWith("+")?"positive":"negative"}>{r[5]}</span><span>{r[6]}</span><span><b className={`activity-status ${r[7].toLowerCase()}`}>{r[7]}</b></span></div>)}</div><button className="plain-link">View all activity ›</button></section>
    <section className="siwon-panel attention-panel"><div className="siwon-panel-title"><h2>Attention Required</h2></div><div className="attention-list"><button><i className="alert">△</i><span>SIWONCOAT Surface — below reorder point</span><b>›</b></button><button><i className="info">ⓘ</i><span>Batch BT-260721 — inspection due</span><b>›</b></button><button><i className="zone-icon">▤</i><span>Zone A-04 — 92% capacity</span><b>›</b></button></div><button className="outline-button">View all alerts</button></section></div>
   <section className="siwon-panel operations-panel"><div className="siwon-panel-title"><h2>Today&apos;s Operations</h2></div><div className="timeline"><div className="timeline-line" />{[["complete","08:30","Material received","A-03"],["complete","","Quality inspection","QA-01"],["current","","Production transfer","PRD-02"],["","","Carrier pickup","B-12"]].map(([state,time,title,loc])=><div className={`timeline-step ${state}`} key={title}><i>{state==="complete"?"✓":""}</i><b>{time||" "}</b><span>{title}</span><small>{loc}</small></div>)}</div></section>
  </div>
 </div>;
}
