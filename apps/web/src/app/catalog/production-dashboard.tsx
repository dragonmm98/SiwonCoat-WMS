"use client";

import { useState } from "react";
import styles from "./production-dashboard.module.css";

const materials = [
  ["Acrylic Emulsion", "2,000 L", "2,500 L", "80%"], ["Ceramic Beads", "750 kg", "1,000 kg", "75%"],
  ["Silica", "500 kg", "600 kg", "83%"], ["Additive", "100 kg", "150 kg", "67%"], ["Defoamer", "20 kg", "30 kg", "67%"],
];
const schedule = [
  ["Aug 28, 2026 08:00","SIWONCOAT Cool","CC-260828-0130","5,000 L","Line 1","Planned"],
  ["Aug 28, 2026 09:00","SIWONCOAT Surface","CS-260828-0091","4,000 L","Line 2","Planned"],
  ["Aug 28, 2026 10:00","SIWONCOAT Cool","CC-260828-0131","6,000 L","Line 1","Planned"],
  ["Aug 28, 2026 11:00","SIWONCOAT Surface","CS-260828-0092","3,000 L","Line 2","Planned"],
];

function BatchCard({ surface = false }: { surface?: boolean }) {
  const progress = surface ? 90 : 65;
  return <article className={styles.batchCard}>
    <div className={styles.batchInfo}><div className={styles.bucket}><i>SIWONCOAT</i><b>{surface ? "SURFACE" : "COOL"}</b></div><div><em>{surface ? "SIWONCOAT Surface" : "SIWONCOAT Cool"}</em><h2>Batch {surface ? "CS-260827-0087" : "CC-260827-0123"}</h2><dl><dt>Planned Quantity</dt><dd>{surface ? "4,000" : "5,000"} L</dd><dt>Start Date</dt><dd>Aug 27, 2026 {surface ? "09:00" : "08:00"}</dd><dt>Expected Completion</dt><dd>Aug 28, 2026 {surface ? "18:00" : "17:00"}</dd><dt>Status</dt><dd><span className={surface ? styles.qcBadge : styles.productionBadge}>{surface ? "Quality Check" : "In Production"}</span></dd></dl><hr/><dl><dt>Operator</dt><dd>{surface ? "Park Jissoo" : "Kim Minsoo"}</dd><dt>Line</dt><dd>{surface ? "Line 2" : "Line 1"}</dd></dl></div></div>
    <div className={styles.batchProgress}><div className={styles.progressTitle}><b>Production Progress</b><strong>{progress}%</strong></div><div className={styles.progressBar}><i style={{width:`${progress}%`}}/></div><div className={styles.steps}>{["Mixing","Dispersion","Filling","Finished"].map((step,index)=><span className={index < (surface?3:2) ? styles.done : index === 2 && !surface ? styles.current : ""} key={step}><i>{index < (surface?3:2)?"✓":index+1}</i>{step}</span>)}</div><div className={styles.detailGrid}><div className={styles.materials}><h3>Raw Material Consumption</h3><div className={styles.miniHead}><span>Material</span><span>Used</span><span>Planned</span><span>%</span></div>{materials.map((row)=><div key={row[0]}>{row.map((cell)=><span key={cell}>{cell}</span>)}</div>)}</div><div className={styles.qc}><h3>QC Status</h3>{["Appearance","pH","Viscosity","Density","Solid Content"].map((item,index)=><p key={item}><span>{index+1}. {item}</span><b className={index < (surface?3:2) ? styles.checked : styles.pending}>{index < (surface?3:2)?"✓ Checked":"− Pending"}</b></p>)}</div></div></div>
    <aside className={styles.actions}><h3>Actions</h3><button>▣ &nbsp; View Details</button><button>▤ &nbsp; Record QC</button><button className={styles.complete}>✓ &nbsp; Complete Batch</button></aside>
  </article>;
}

export function ProductionDashboard() {
  const [tab,setTab] = useState("All");
  return <div className={styles.page}>
    <header><div><h1>Production &amp; Batches</h1><p>Manage coating production, materials and quality control</p></div></header>
    <section className={styles.metrics}>{[["⚗","Active Batches","4","green"],["□","Planned Today","6","blue"],["✓","Completed Today","2","orange"],["◇","QC Pending","2","purple"]].map(([icon,label,value,tone])=><article key={label}><i className={styles[tone]}>{icon}</i><div><span>{label}</span><strong>{value}</strong></div></article>)}</section>
    <nav className={styles.tabs}>{["All","SIWONCOAT Cool","SIWONCOAT Surface","Completed"].map(item=><button className={tab===item?styles.active:""} onClick={()=>setTab(item)} key={item}>{item}</button>)}</nav>
    <section className={styles.filters}><label>⌕ <input placeholder="Search by batch number"/></label><select><option>Product — All</option></select><select><option>Status — All</option></select><label>Date&nbsp; Aug 20, 2026 – Aug 27, 2026</label><button>＋ New Batch</button></section>
    <BatchCard/><BatchCard surface/>
    <section className={styles.schedule}><h2>Production Schedule</h2><div className={styles.scheduleHead}>{["Start Time","Product","Batch Number","Planned Quantity","Line","Status"].map(x=><span key={x}>{x}</span>)}</div>{schedule.map(row=><div key={row[2]}>{row.map((cell,index)=><span key={cell} className={index===5?styles.planned:""}>{cell}</span>)}</div>)}</section>
  </div>;
}
