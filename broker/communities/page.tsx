import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { BrokerCommunitiesDirectory } from "@/components/broker-communities-directory";
import { CommunityCreatePanel } from "@/components/community-create-panel";
import { requireProfile } from "@/lib/auth";
import { demoCommunities } from "@/lib/demo-data";

export default async function BrokerCommunitiesPage() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const [{ data: communities }, { data: companies }] = isDemo
    ? [{ data: null }, { data: [{ id: "demo-company", name: "ETW Administracja", nip: null }] }]
    : await Promise.all([
      supabase!.from("communities").select("id, name, address, nip, regon, administrator_company_id").order("name"),
      supabase!.from("administrator_companies").select("id, name, nip").order("name"),
    ]);
  const items = isDemo ? demoCommunities.map((community) => ({ ...community, nip: null, regon: null, administrator_company_id: "demo-company" })) : communities || [];
  return <AppShell profile={profile}><header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Obsługiwane wspólnoty</h1><p className="subtitle">Wspólnoty objęte obsługą ubezpieczeniową ({items.length}).</p></div><Link className="button button-primary" href="/broker">Zgłoszone szkody</Link></header><CommunityCreatePanel companies={companies || []} isDemo={isDemo}/><BrokerCommunitiesDirectory communities={items} companies={companies || []}/></AppShell>;
}
