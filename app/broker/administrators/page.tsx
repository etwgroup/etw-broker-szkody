import Link from "next/link";
import { Building2, ClipboardList, UsersRound } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { demoCommunities } from "@/lib/demo-data";

type Administrator = { id: string; full_name: string | null };
type CommunityOwner = { administrator_id: string };

export default async function BrokerAdministratorsPage() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const [{ data: administrators }, { data: communities }] = isDemo
    ? [{ data: [{ id: "demo-administrator", full_name: "Anna Administrator" }] }, { data: demoCommunities.map(() => ({ administrator_id: "demo-administrator" })) }]
    : await Promise.all([
      supabase!.from("profiles").select("id, full_name").eq("role", "administrator").order("full_name"),
      supabase!.from("communities").select("administrator_id"),
    ]);

  const communityCountByAdministrator = new Map<string, number>();
  for (const community of (communities || []) as CommunityOwner[]) {
    communityCountByAdministrator.set(community.administrator_id, (communityCountByAdministrator.get(community.administrator_id) || 0) + 1);
  }
  const items = (administrators || []) as Administrator[];

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Administratorzy</h1><p className="subtitle">Administratorzy obsługujący wspólnoty w portfelu brokera.</p></div><Link className="button button-secondary" href="/broker/communities"><Building2 size={16}/> Wspólnoty</Link></header>
    <section className="stats stats--five"><article className="stat-card"><span>Administratorzy</span><strong>{items.length}</strong></article><article className="stat-card"><span>Obsługiwane wspólnoty</span><strong className="success">{(communities || []).length}</strong></article></section>
    {items.length === 0 ? <section className="panel empty-state"><UsersRound size={28}/><p>Nie dodano jeszcze administratorów.</p></section> : <section className="communities-grid">{items.map((administrator) => { const count = communityCountByAdministrator.get(administrator.id) || 0; return <article key={administrator.id} className="community-card administrator-card"><span className="community-icon"><UsersRound size={20}/></span><div><h2>{administrator.full_name || "Administrator bez nazwy"}</h2><p><Building2 size={13}/>{count} {count === 1 ? "obsługiwana wspólnota" : count < 5 ? "obsługiwane wspólnoty" : "obsługiwanych wspólnot"}</p><small><ClipboardList size={11}/> Dostęp do zgłoszeń przypisanych wspólnot</small></div></article>; })}</section>}
  </AppShell>;
}
