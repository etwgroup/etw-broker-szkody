import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { formatDate } from "@/lib/claims";
import { StatusBadge } from "@/components/status-badge";

type Community = { name?: string; address?: string };
type Claim = { id: string; reference: string; title: string; status: string; occurred_at: string; created_at: string; communities?: Community | Community[] | null };

export function ClaimsTable({ claims, panel = "admin" }: { claims: Claim[]; panel?: "admin" | "broker" }) {
  if (!claims.length) return <div className="empty-state"><ArrowUpRight size={25}/><p>Brak zgłoszeń do wyświetlenia.</p></div>;
  const base = panel === "broker" ? "/broker/damages" : "/admin/damages";
  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Nr szkody</th><th>{panel === "broker" ? "Wspólnota / szkoda" : "Szkoda"}</th><th>Data zdarzenia</th><th>Status</th><th></th></tr></thead><tbody>
    {claims.map((claim) => { const community = Array.isArray(claim.communities) ? claim.communities[0] : claim.communities; return <tr key={claim.id}><td><span className="claim-title">{claim.reference}</span><span className="claim-meta">zgłoszono {formatDate(claim.created_at)}</span></td><td><span className="claim-title">{claim.title}</span>{community && <span className="claim-meta">{community.name}{panel === "broker" && community.address ? ` · ${community.address}` : ""}</span>}</td><td>{formatDate(claim.occurred_at)}</td><td><StatusBadge status={claim.status}/></td><td><Link aria-label="Otwórz szkodę" href={`${base}/${claim.id}`}><ArrowUpRight size={16} color="#c9002b"/></Link></td></tr>; })}
  </tbody></table></div>;
}
