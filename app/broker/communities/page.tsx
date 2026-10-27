import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CommunitiesList } from "@/components/communities-list";
import { requireProfile } from "@/lib/auth";
import { demoCommunities } from "@/lib/demo-data";

export default async function BrokerCommunitiesPage() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const { data: communities } = isDemo ? { data: null } : await supabase!.from("communities").select("id, name, address, nip").order("name");
  const items = isDemo ? demoCommunities : communities || [];
  return <AppShell profile={profile}><header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Wspólnoty</h1><p className="subtitle">Wspólnoty objęte obsługą ubezpieczeniową ({items.length}).</p></div><Link className="button button-primary" href="/broker">Zgłoszone szkody</Link></header><CommunitiesList communities={items} basePath="/broker/communities"/></AppShell>;
}
