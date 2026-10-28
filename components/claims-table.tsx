"use client";

import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { KeyboardEvent } from "react";
import { useRouter } from "next/navigation";
import { formatDate } from "@/lib/claims";
import { StatusBadge } from "@/components/status-badge";

type Community = { name?: string; address?: string };
type Claim = { id: string; reference: string; title: string; status: string; occurred_at: string; created_at: string; communities?: Community | Community[] | null };

export function ClaimsTable({ claims, panel = "admin" }: { claims: Claim[]; panel?: "admin" | "broker" }) {
  const router = useRouter();
  if (!claims.length) return <div className="empty-state"><ArrowUpRight size={25}/><p>Brak zgłoszeń do wyświetlenia.</p></div>;
  const base = panel === "broker" ? "/broker/damages" : "/admin/damages";
  const openClaim = (claimId: string) => router.push(`${base}/${claimId}`);
  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, claimId: string) => {
    if (event.key === "Enter" || event.key === " ") {
      event.preventDefault();
      openClaim(claimId);
    }
  };

  return <div className="table-wrap"><table className="data-table"><thead><tr><th>Nr szkody</th><th>{panel === "broker" ? "Wspólnota / szkoda" : "Szkoda"}</th><th>Data zdarzenia</th><th>Status</th><th></th></tr></thead><tbody>
    {claims.map((claim) => {
      const community = Array.isArray(claim.communities) ? claim.communities[0] : claim.communities;
      const href = `${base}/${claim.id}`;
      return <tr className="claim-row" key={claim.id} tabIndex={0} role="link" aria-label={`Otwórz szkodę ${claim.reference}: ${claim.title}`} onClick={() => openClaim(claim.id)} onKeyDown={(event) => onRowKeyDown(event, claim.id)}>
        <td><span className="claim-title">{claim.reference}</span><span className="claim-meta">zgłoszono {formatDate(claim.created_at)}</span></td>
        <td><span className="claim-title">{claim.title}</span>{community && <span className="claim-meta">{community.name}{panel === "broker" && community.address ? ` · ${community.address}` : ""}</span>}</td>
        <td>{formatDate(claim.occurred_at)}</td>
        <td><StatusBadge status={claim.status}/></td>
        <td><Link aria-label="Otwórz szkodę" href={href} onClick={(event) => event.stopPropagation()}><ArrowUpRight size={16} color="#c9002b"/></Link></td>
      </tr>;
    })}
  </tbody></table></div>;
}
