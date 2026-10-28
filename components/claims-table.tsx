"use client";

import Link from "next/link";
import { ArrowUpRight, MessageCircleMore, Search, SlidersHorizontal, X } from "lucide-react";
import { KeyboardEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { formatDate, statusMeta } from "@/lib/claims";
import { StatusBadge } from "@/components/status-badge";

type Community = { name?: string; address?: string };
type Claim = { id: string; reference: string; title: string; status: string; occurred_at: string; created_at: string; counterparty_reply_at?: string; counterparty_reply_from?: "administrator" | "broker"; communities?: Community | Community[] | null };

export function ClaimsTable({ claims, panel = "admin", showFilters = false }: { claims: Claim[]; panel?: "admin" | "broker"; showFilters?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const base = panel === "broker" ? "/broker/damages" : "/admin/damages";
  const filteredClaims = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase("pl-PL");
    return claims.filter((claim) => {
      const community = Array.isArray(claim.communities) ? claim.communities[0] : claim.communities;
      const searchable = [claim.reference, claim.title, community?.name, community?.address].filter(Boolean).join(" ").toLocaleLowerCase("pl-PL");
      const occurredAt = claim.occurred_at.slice(0, 10);
      return (!normalizedQuery || searchable.includes(normalizedQuery))
        && (!status || claim.status === status)
        && (!dateFrom || occurredAt >= dateFrom)
        && (!dateTo || occurredAt <= dateTo);
    });
  }, [claims, dateFrom, dateTo, query, status]);
  const openClaim = (claimId: string) => router.push(`${base}/${claimId}`);
  const onRowKeyDown = (event: KeyboardEvent<HTMLTableRowElement>, claimId: string) => {
    if (event.key === "Enter" || event.key === " ") { event.preventDefault(); openClaim(claimId); }
  };
  const clearFilters = () => { setQuery(""); setStatus(""); setDateFrom(""); setDateTo(""); };

  if (!claims.length) return <div className="empty-state"><ArrowUpRight size={25}/><p>Brak zgłoszeń do wyświetlenia.</p></div>;
  return <>
    {showFilters && <section className="claims-filters" aria-label="Wyszukiwanie i filtrowanie szkód"><div className="claims-filters__heading"><SlidersHorizontal size={16}/><span>Wyszukaj i filtruj szkody</span></div><label className="claims-filters__search"><Search size={16}/><input value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Numer szkody, nazwa, wspólnota lub adres…"/></label><label>Status<select value={status} onChange={(event) => setStatus(event.target.value)}><option value="">Wszystkie statusy</option>{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></label><label>Od daty<input type="date" value={dateFrom} onChange={(event) => setDateFrom(event.target.value)}/></label><label>Do daty<input type="date" value={dateTo} onChange={(event) => setDateTo(event.target.value)}/></label>{(query || status || dateFrom || dateTo) && <button type="button" className="button button-ghost" onClick={clearFilters}><X size={14}/> Wyczyść</button>}<span className="claims-filters__count">{filteredClaims.length} z {claims.length}</span></section>}
    <div className="table-wrap"><table className="data-table"><thead><tr><th>Nr szkody</th><th>{panel === "broker" ? "Wspólnota / szkoda" : "Szkoda"}</th><th>Data zdarzenia</th><th>Status</th><th></th></tr></thead><tbody>
      {filteredClaims.map((claim) => {
        const community = Array.isArray(claim.communities) ? claim.communities[0] : claim.communities;
        const href = `${base}/${claim.id}`;
        return <tr className="claim-row" key={claim.id} tabIndex={0} role="link" aria-label={`Otwórz szkodę ${claim.reference}: ${claim.title}`} onClick={() => openClaim(claim.id)} onKeyDown={(event) => onRowKeyDown(event, claim.id)}>
          <td><span className="claim-title">{claim.reference}</span><span className="claim-meta">zgłoszono {formatDate(claim.created_at)}</span></td>
          <td><span className="claim-title">{claim.title}</span>{community && <span className="claim-meta">{community.name}{panel === "broker" && community.address ? ` · ${community.address}` : ""}</span>}</td>
          <td>{formatDate(claim.occurred_at)}</td>
          <td><div className="claim-status-cell"><StatusBadge status={claim.status}/>{claim.counterparty_reply_at && <span className="broker-reply-badge"><MessageCircleMore size={11}/> Odpowiedź {claim.counterparty_reply_from === "administrator" ? "administratora" : "brokera"}</span>}</div></td>
          <td><Link aria-label="Otwórz szkodę" href={href} onClick={(event) => event.stopPropagation()}><ArrowUpRight size={16} color="#c9002b"/></Link></td>
        </tr>;
      })}
      {!filteredClaims.length && <tr><td colSpan={5}><div className="table-empty">Nie znaleziono szkód spełniających wybrane kryteria.</div></td></tr>}
    </tbody></table></div>
  </>;
}
