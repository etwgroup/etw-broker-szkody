import Link from "next/link";
import { Building2, ClipboardList, UsersRound } from "lucide-react";
import { AdministratorAccountForm } from "@/components/administrator-account-form";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { demoCommunities } from "@/lib/demo-data";

type Company = { id: string; name: string; nip: string | null };
type Administrator = { id: string; full_name: string | null; administrator_company_id: string | null };
type CommunityOwner = { administrator_company_id: string | null };

function communityWord(count: number) {
  return count === 1 ? "wspólnota" : count % 10 >= 2 && count % 10 <= 4 && (count < 10 || count > 20) ? "wspólnoty" : "wspólnot";
}

export default async function BrokerAdministratorsPage() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const [{ data: companies }, { data: administrators }, { data: communities }] = isDemo
    ? [
      { data: [{ id: "demo-company", name: "ETW Administracja", nip: null }] },
      { data: [{ id: "demo-administrator", full_name: "Anna Administrator", administrator_company_id: "demo-company" }] },
      { data: demoCommunities.map(() => ({ administrator_company_id: "demo-company" })) },
    ]
    : await Promise.all([
      supabase!.from("administrator_companies").select("id, name, nip").order("name"),
      supabase!.from("profiles").select("id, full_name, administrator_company_id").eq("role", "administrator").order("full_name"),
      supabase!.from("communities").select("administrator_company_id"),
    ]);

  const companyItems = (companies || []) as Company[];
  const accountItems = (administrators || []) as Administrator[];
  const communityCountByCompany = new Map<string, number>();
  const accountsByCompany = new Map<string, Administrator[]>();
  for (const community of (communities || []) as CommunityOwner[]) {
    if (!community.administrator_company_id) continue;
    communityCountByCompany.set(community.administrator_company_id, (communityCountByCompany.get(community.administrator_company_id) || 0) + 1);
  }
  for (const administrator of accountItems) {
    if (!administrator.administrator_company_id) continue;
    accountsByCompany.set(administrator.administrator_company_id, [...(accountsByCompany.get(administrator.administrator_company_id) || []), administrator]);
  }
  const assignedCommunities = Array.from(communityCountByCompany.values()).reduce((sum, count) => sum + count, 0);

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Obsługiwani Administratorzy</h1><p className="subtitle">Konta administratorów są grupowane w firmach, które obsługują wspólnoty.</p></div><Link className="button button-secondary" href="/broker/communities"><Building2 size={16}/> Wspólnoty</Link></header>
    <AdministratorAccountForm companies={companyItems} isDemo={isDemo}/>
    <section className="stats stats--five"><article className="stat-card"><span>Firmy administrujące</span><strong>{companyItems.length}</strong></article><article className="stat-card"><span>Konta administratorów</span><strong>{accountItems.length}</strong></article><article className="stat-card"><span>Przypisane wspólnoty</span><strong className="success">{assignedCommunities}</strong></article></section>
    {companyItems.length === 0 ? <section className="panel empty-state"><UsersRound size={28}/><p>Nie dodano jeszcze firmy administrującej. Utwórz pierwsze konto wraz z firmą powyżej.</p></section> : <section className="communities-grid">{companyItems.map((company) => { const accounts = accountsByCompany.get(company.id) || []; const communityCount = communityCountByCompany.get(company.id) || 0; return <article key={company.id} className="community-card administrator-card"><span className="community-icon"><Building2 size={20}/></span><div><h2>{company.name}</h2><p><ClipboardList size={13}/>{communityCount} {communityWord(communityCount)} w obsłudze</p><small><UsersRound size={11}/>{accounts.length ? accounts.map((account) => account.full_name || "Administrator").join(", ") : "Brak przypisanych kont"}</small></div></article>; })}</section>}
  </AppShell>;
}
