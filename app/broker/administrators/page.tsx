import Link from "next/link";
import { Building2 } from "lucide-react";
import { AdministratorCompanyManager } from "@/components/administrator-company-manager";
import { AppShell } from "@/components/app-shell";
import { requireProfile } from "@/lib/auth";
import { companyLogoUrl } from "@/lib/company-logo";
import { demoCommunities } from "@/lib/demo-data";

type Company = { id: string; name: string; nip: string | null; logo_path: string | null };
type Administrator = { id: string; full_name: string | null; email: string | null; administrator_company_id: string | null };
type CommunityOwner = { administrator_company_id: string | null };

export default async function BrokerAdministratorsPage() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const [{ data: companies }, { data: administrators }, { data: communities }] = isDemo
    ? [
      { data: [{ id: "demo-company", name: "ETW Administracja", nip: null, logo_path: null }] },
      { data: [{ id: "demo-administrator", full_name: "Anna Administrator", email: "administrator@etw.demo", administrator_company_id: "demo-company" }] },
      { data: demoCommunities.map(() => ({ administrator_company_id: "demo-company" })) },
    ]
    : await Promise.all([
      supabase!.from("administrator_companies").select("id, name, nip, logo_path").order("name"),
      supabase!.from("profiles").select("id, full_name, email, administrator_company_id").eq("role", "administrator").order("full_name"),
      supabase!.from("communities").select("administrator_company_id"),
    ]);

  const companyItems = (companies || []) as Company[];
  const accountItems = (administrators || []) as Administrator[];
  const communityCountByCompany = new Map<string, number>();
  const accountCountByCompany = new Map<string, number>();
  for (const community of (communities || []) as CommunityOwner[]) {
    if (community.administrator_company_id) communityCountByCompany.set(community.administrator_company_id, (communityCountByCompany.get(community.administrator_company_id) || 0) + 1);
  }
  for (const account of accountItems) {
    if (account.administrator_company_id) accountCountByCompany.set(account.administrator_company_id, (accountCountByCompany.get(account.administrator_company_id) || 0) + 1);
  }
  const assignedCommunities = Array.from(communityCountByCompany.values()).reduce((sum, count) => sum + count, 0);
  const companiesForManager = companyItems.map((company) => ({
    ...company,
    logoUrl: companyLogoUrl(company.logo_path),
    accountCount: accountCountByCompany.get(company.id) || 0,
    communityCount: communityCountByCompany.get(company.id) || 0,
  }));

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Obsługiwani Administratorzy</h1><p className="subtitle">Firmy posiadają wspólnoty, a ich pracownicy otrzymują dostęp przez przypisane konta.</p></div><Link className="button button-secondary" href="/broker/communities"><Building2 size={16}/> Wspólnoty</Link></header>
    <section className="stats stats--five"><article className="stat-card"><span>Firmy administrujące</span><strong>{companyItems.length}</strong></article><article className="stat-card"><span>Konta administratorów</span><strong>{accountItems.length}</strong></article><article className="stat-card"><span>Przypisane wspólnoty</span><strong className="success">{assignedCommunities}</strong></article></section>
    <AdministratorCompanyManager companies={companiesForManager} isDemo={isDemo}/>
  </AppShell>;
}
