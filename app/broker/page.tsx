import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { requireProfile } from "@/lib/auth";
import { demoClaims } from "@/lib/demo-data";

export default async function BrokerDashboard() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const { data: claims } = isDemo ? { data: null } : await supabase!.from("claims").select("id, reference, title, status, occurred_at, created_at, communities(name, address)").order("created_at", { ascending: false });
  const items = isDemo ? demoClaims : claims || [];
  const fresh = items.filter((claim) => claim.status === "new");
  const insurer = items.filter((claim) => ["submitted_to_insurer", "insurer_claim_number_assigned"].includes(claim.status));
  return <AppShell profile={profile}><header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Centrum obsługi szkód</h1><p className="subtitle">Nowe zgłoszenia od administratorów i bieżący postęp spraw.</p></div></header><section className="stats"><article className="stat-card"><span>Zgłoszone szkody</span><strong>{items.length}</strong></article><article className="stat-card"><span>Nowe do weryfikacji</span><strong className="warning">{fresh.length}</strong></article><article className="stat-card"><span>U ubezpieczyciela</span><strong>{insurer.length}</strong></article><article className="stat-card"><span>Wypłacone</span><strong className="success">{items.filter((claim) => claim.status === "paid").length}</strong></article></section><section className="panel"><div className="panel-header"><h2>Zgłoszone szkody</h2><span className="kicker">{items.length} spraw</span></div><ClaimsTable claims={items} panel="broker"/></section></AppShell>;
}
