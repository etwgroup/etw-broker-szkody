import { Circle } from "lucide-react";
import { ClaimStatus, statusMeta } from "@/lib/claims";

export function StatusBadge({ status }: { status: string }) {
  const meta = statusMeta[status as ClaimStatus] ?? statusMeta.new;
  return <span className={`status ${meta.className}`}><Circle size={6} fill="currentColor" />{meta.label}</span>;
}
