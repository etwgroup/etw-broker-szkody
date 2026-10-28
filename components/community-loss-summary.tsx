"use client";

import { useMemo, useState } from "react";
import { CircleDollarSign, ChartNoAxesCombined, ClipboardList } from "lucide-react";
import { formatCurrency } from "@/lib/claims";

type Claim = { status: string; created_at: string; paid_amount?: string | number | null; paid_at?: string | null };

export function CommunityLossSummary({ claims }: { claims: Claim[] }) {
  const currentYear = new Date().getFullYear();
  const years = useMemo(() => Array.from(new Set([currentYear, ...claims.flatMap((claim) => [claim.created_at, claim.paid_at].filter(Boolean).map((date) => new Date(date as string).getFullYear()))])).sort((a, b) => b - a), [claims, currentYear]);
  const [year, setYear] = useState(currentYear);
  const claimsInYear = claims.filter((claim) => new Date(claim.created_at).getFullYear() === year);
  const paidClaims = claims.filter((claim) => claim.status === "paid" && claim.paid_at && new Date(claim.paid_at).getFullYear() === year && claim.paid_amount != null);
  const paidAmount = paidClaims.reduce((sum, claim) => sum + Number(claim.paid_amount), 0);

  return <section className="community-loss panel">
    <header><div><p className="kicker">Szkodowość wspólnoty</p><h2><ChartNoAxesCombined size={18}/> Podsumowanie roczne</h2></div><label>Rok<select value={year} onChange={(event) => setYear(Number(event.target.value))}>{years.map((value) => <option key={value} value={value}>{value}</option>)}</select></label></header>
    <div className="community-loss__stats"><article><CircleDollarSign size={18}/><span>Suma wypłat</span><strong>{formatCurrency(paidAmount)}</strong></article><article><ClipboardList size={18}/><span>Wypłacone szkody</span><strong>{paidClaims.length}</strong></article><article><ChartNoAxesCombined size={18}/><span>Zgłoszenia w roku</span><strong>{claimsInYear.length}</strong></article></div>
    <p>Szkodowość to suma kwot wypłaconych przez ubezpieczyciela w wybranym roku kalendarzowym.</p>
  </section>;
}
