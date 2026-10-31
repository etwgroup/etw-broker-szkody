import { ArrowLeft, Building2, UsersRound } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AdministratorAccountDirectory } from "@/components/administrator-account-directory";
import { AdministratorAccountForm } from "@/components/administrator-account-form";
import { AdministratorCompanyEditForm } from "@/components/administrator-company-edit-form";
import { BrokerDeleteConfirmation } from "@/components/broker-delete-confirmation";
import { AppShell } from "@/components/app-shell";
import { CommunitiesList } from "@/components/communities-list";
import { requireProfile } from "@/lib/auth";
import { companyLogoUrl } from "@/lib/company-logo";
import { demoCommunities } from "@/lib/demo-data";

type Company = { id: string; name: string; nip: string | null; logo_path: string | null; logoUrl?: string | null };
type Administrator = { id: string; full_name: string | null; email: string | null; administrator_company_id: string | null; account_activated_at: string | null };
type Community = { id: string; name: string; address: string; nip: string | null; regon: string | null };

export default async function BrokerAdministratorCompanyPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, isDemo } = await requireProfile("broker");
  let company: Company | null = null;
  let accounts: Administrator[] = [];
  let communities: Community[] = [];

  if (isDemo) {
    if (id !== "demo-company") notFound();
    company = { id: "demo-company", name: "ETW Administracja", nip: null, logo_path: null };
    accounts = [{ id: "demo-administrator", full_name: "Anna Administrator", email: "administrator@etw.demo", administrator_company_id: "demo-company", account_activated_at: "2026-01-01T12:00:00.000Z" }];
    communities = demoCommunities.map((community) => ({ ...community, nip: null, regon: null }));
  } else {
    const { data: companyData } = await supabase!.from("administrator_companies").select("id, name, nip, logo_path").eq("id", id).maybeSingle();
    if (!companyData) notFound();
    company = { ...(companyData as Company), logoUrl: companyLogoUrl(companyData.logo_path) };
    const [{ data: accountData }, { data: communityData }] = await Promise.all([
      supabase!.from("profiles").select("id, full_name, email, administrator_company_id, account_activated_at").eq("role", "administrator").eq("administrator_company_id", id).order("full_name"),
      supabase!.from("communities").select("id, name, address, nip, regon").eq("administrator_company_id", id).order("name"),
    ]);
    accounts = (accountData || []) as Administrator[];
    communities = (communityData || []) as Community[];
  }

  return <AppShell profile={profile}>
    <header className="page-top"><div><Link className="kicker" href="/broker/administrators"><ArrowLeft size={12}/> Wróć do firm administrujących</Link><h1>{company.name}</h1><p className="subtitle">{company.nip ? `NIP ${company.nip} · ` : ""}{accounts.length} kont administratorów · {communities.length} obsługiwanych wspólnot</p></div><BrokerDeleteConfirmation target={{ kind: "company", id: company.id, name: company.name }} isDemo={isDemo}/></header>
    <section className="company-overview panel"><span className="company-overview__logo">{company.logoUrl ? <img src={company.logoUrl} alt={`Logo ${company.name}`}/> : <Building2 size={20}/>}</span><div><p className="kicker">Firma administrująca</p><h2>{company.name}</h2><p>Każde konto przypisane do tej firmy ma wgląd do wspólnot widocznych poniżej.</p></div></section>
    <AdministratorCompanyEditForm company={company} isDemo={isDemo}/>
    <AdministratorAccountForm company={company} isDemo={isDemo}/>
    <AdministratorAccountDirectory accounts={accounts} companies={[company]} isDemo={isDemo}/>
    <section className="company-communities panel"><div className="panel-header"><div><p className="kicker">Portfel firmy</p><h2><UsersRound size={16}/> Obsługiwane wspólnoty ({communities.length})</h2></div><Link href="/broker/communities" className="text-button">Zarządzaj wspólnotami</Link></div><div className="company-communities__content"><CommunitiesList communities={communities} basePath="/broker/communities"/></div></section>
  </AppShell>;
}
