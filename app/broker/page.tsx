import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { requireProfile } from "@/lib/auth";
import { demoClaimMessages, demoClaims } from "@/lib/demo-data";

type Message = { claim_id: string; sender_role: "administrator" | "broker"; created_at: string };

export default async function BrokerDashboard() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const { data: claims } = isDemo
    ? { data: null }
    : await supabase!.from("claims").select("id, reference, title, status, occurred_at, created_at, last_message_at, last_message_sender_role, communities(name, address)").order("created_at", { ascending: false });
  const latestMessageByClaim = new Map<string, Message>();
  demoClaimMessages.forEach((message) => {
    const latest = latestMessageByClaim.get(message.claim_id);
    if (!latest || new Date(message.created_at).getTime() > new Date(latest.created_at).getTime()) latestMessageByClaim.set(message.claim_id, message);
  });
  const items = isDemo
    ? demoClaims.map((claim) => {
      const latestMessage = latestMessageByClaim.get(claim.id);
      return {
        ...claim,
        counterparty_reply_at: latestMessage?.sender_role === "administrator" ? latestMessage.created_at : undefined,
        counterparty_reply_from: "administrator" as const,
      };
    })
    : (claims || []).map((claim) => ({
      ...claim,
      counterparty_reply_at: claim.last_message_sender_role === "administrator" ? claim.last_message_at || undefined : undefined,
      counterparty_reply_from: "administrator" as const,
    }));
  const fresh = items.filter((claim) => claim.status === "new");
  const insurer = items.filter((claim) => ["submitted_to_insurer", "insurer_claim_number_assigned"].includes(claim.status));

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Centrum obsługi szkód</h1><p className="subtitle">Nowe zgłoszenia od administratorów i bieżący postęp spraw.</p></div></header>
    <section className="stats"><article className="stat-card"><span>Zgłoszone szkody</span><strong>{items.length}</strong></article><article className="stat-card"><span>Nowe do weryfikacji</span><strong className="warning">{fresh.length}</strong></article><article className="stat-card"><span>U ubezpieczyciela</span><strong>{insurer.length}</strong></article><article className="stat-card"><span>Wypłacone</span><strong className="success">{items.filter((claim) => claim.status === "paid").length}</strong></article></section>
    <section className="panel"><div className="panel-header"><h2>Zgłoszone szkody</h2><span className="kicker">{items.length} spraw</span></div><ClaimsTable claims={items} panel="broker" showFilters/></section>
  </AppShell>;
}
