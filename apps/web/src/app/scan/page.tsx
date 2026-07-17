import type { Metadata } from "next";
import { ScannerWorkflow } from "./scanner-workflow";

export const metadata: Metadata = { title: "Scanner" };

export default function ScannerPage() {
  return (
    <div className="scan-shell">
      <ScannerWorkflow />
    </div>
  );
}
