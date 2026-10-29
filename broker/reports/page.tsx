import { BarChart3, CircleDollarSign, Building2, ClipboardList, CircleCheckBig } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { formatCurrency } from "@/lib/claims";
import { requireProfile } from "@/lib/auth";
import { demoClaims, demoCommunities } from "@/lib/demo-data";

type ReportClaim = { id: string; community_id: string; status: string; created_at: string; paid_amount?: string | number | null; paid_at?: string | null };
type Community = { id: string; name: string; address: string };

function yearFrom(value?: string | null) {
  return value ? new Date(value).getFullYear() : null;
}

export default async function BrokerReportsPage({ searchParams }: { searchParams: Promise<{ year?: string }> }) {
  const query = await searchParams;
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const [{ data: claims }, { data: communities }] = isDemo
    ? [{ data: null }, { data: null }]
    : await Promise.all([
      supabase!.from("claims").select("id, community_id, status, created_at, paid_amount, paid_at"),
      supabase!.from("communities").select("id, name, address").order("name"),
    ]);
  const claimItems: ReportClaim[] = isDemo
    ? demoClaims.map((claim) => ({ id: claim.id, community_id: claim.communities.id, status: claim.status, created_at: claim.created_at, paid_amount: claim.paid_amount, paid_at: claim.paid_at }))
    : (claims || []) as ReportClaim[];
  const communityItems: Community[] = isDemo ? demoCommunities : (communities || []) as Community[];
  const currentYear = new Date().getFullYear();
  const years = Array.from(new Set([currentYear, ...claimItems.flatMap((claim) => [yearFrom(claim.created_at), yearFrom(claim.paid_at)].filter((year): year is number => year !== null))])).sort((a, b) => b - a);
  const requestedYear = Number(query.year);
  const selectedYear = years.includes(requestedYear) ? requestedYear : currentYear;
  const claimsInYear = claimItems.filter((claim) => yearFrom(claim.created_at) === selectedYear);
  const paidClaims = claimItems.filter((claim) => claim.status === "paid" && claim.paid_amount != null && yearFrom(claim.paid_at) === selectedYear);
  const paidAmount = paidClaims.reduce((sum, claim) => sum + Number(claim.paid_amount), 0);
  const rows = communityItems.map((community) => {
    const communityClaims = claimsInYear.filter((claim) => claim.community_id === community.id);
    const communityPaid = paidClaims.filter((claim) => claim.community_id === community.id);
    return { community, claimCount: communityClaims.length, paidCount: communityPaid.length, paidAmount: communityPaid.reduce((sum, claim) => sum + Number(claim.paid_amount), 0) };
  }).sort((a, b) => b.paidAmount - a.paidAmount || a.community.name.localeCompare(b.community.name, "pl"));

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Raport szkód i szkodowości</h1><p className="subtitle">Podsumowanie liczby zgłoszeń i wypłat w wybranym roku kalendarzowym.</p></div></header>
    <section className="report-year panel"><form><label htmlFor="report-year">Rok raportu</label><select id="report-year" name="year" defaultValue={selectedYear}>{years.map((year) => <option key={year} value={year}>{year}</option>)}</select><button className="button button-primary" type="submit">Pokaż raport</button></form><p>Szkodowość to suma kwot wypłaconych przez ubezpieczycieli w wybranym roku.</p></section>
    <section className="stats stats--reports"><article className="stat-card"><span><ClipboardList size={15}/> Szkody zgłoszone</span><strong>{claimsInYear.length}</strong></article><article className="stat-card"><span><CircleCheckBig size={15}/> Wypłacone szkody</span><strong className="success">{paidClaims.length}</strong></article><article className="stat-card"><span><CircleDollarSign size={15}/> Szkodowość</span><strong className="warning">{formatCurrency(paidAmount)}</strong></article><article className="stat-card"><span><Building2 size={15}/> Wspólnoty z wypłatą</span><strong>{rows.filter((row) => row.paidAmount > 0).length}</strong></article></section>
    <section className="panel report-table"><div className="panel-header"><h2><BarChart3 size={18}/> Szkodowość według wspólnot</h2><span className="kicker">{selectedYear}</span></div><div className="table-wrap"><table className="data-table"><thead><tr><th>Wspólnota</th><th>Zgłoszone szkody</th><th>Wypłacone szkody</th><th>Suma wypłat</th></tr></thead><tbody>{rows.map((row) => <tr key={row.community.id}><td><Link href={`/broker/communities/${row.community.id}`} className="report-table__community"><strong>{row.community.name}</strong><span>{row.community.address}</span></Link></td><td>{row.claimCount}</td><td>{row.paidCount}</td><td className="report-table__amount">{formatCurrency(row.paidAmount)}</td></tr>)}</tbody></table></div></section>
  </AppShell>;
}
