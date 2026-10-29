import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { CommunitiesList } from "@/components/communities-list";
import { requireProfile } from "@/lib/auth";
import { demoCommunities } from "@/lib/demo-data";

export default async function CommunitiesPage() {
  const { supabase, profile, isDemo } = await requireProfile("administrator");
  const { data: communities } = isDemo ? { data: null } : await supabase!.from("communities").select("id, name, address, nip, regon").order("name");
  const items = isDemo ? demoCommunities : communities || [];
  return <AppShell profile={profile}><header className="page-top"><div><p className="kicker">Panel administratora</p><h1>Obsługiwane wspólnoty</h1><p className="subtitle">Lista wspólnot przypisanych do Twojej firmy ({items.length}).</p></div><Link className="button button-primary" href="/admin/damages/new">Zgłoś szkodę</Link></header><CommunitiesList communities={items}/></AppShell>;
}
