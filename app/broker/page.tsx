import { MessageCircleMore } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { formatDateTime } from "@/lib/claims";
import { requireProfile } from "@/lib/auth";
import { demoClaimMessages, demoClaims } from "@/lib/demo-data";

type Reply = { claim_id: string; created_at: string };

export default async function BrokerDashboard() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const { data: claims } = isDemo
    ? { data: null }
    : await supabase!.from("claims").select("id, reference, title, status, occurred_at, created_at, communities(name, address)").order("created_at", { ascending: false });
  const baseItems = isDemo ? demoClaims : claims || [];
  const claimIds = baseItems.map((claim) => claim.id);
  const { data: administratorMessages } = isDemo || !claimIds.length
    ? { data: null }
    : await supabase!.from("claim_messages").select("claim_id, created_at").eq("sender_role", "administrator").in("claim_id", claimIds).order("created_at", { ascending: false });
  const replies: Reply[] = isDemo
    ? demoClaimMessages.filter((message) => message.sender_role === "administrator").map((message) => ({ claim_id: message.claim_id, created_at: message.created_at }))
    : (administratorMessages || []) as Reply[];
  const latestReplyByClaim = new Map<string, Reply>();
  replies.forEach((reply) => {
    if (!latestReplyByClaim.has(reply.claim_id)) latestReplyByClaim.set(reply.claim_id, reply);
  });
  const items = baseItems.map((claim) => ({ ...claim, counterparty_reply_at: latestReplyByClaim.get(claim.id)?.created_at, counterparty_reply_from: "administrator" as const }));
  const repliedClaims = items.filter((claim) => claim.counterparty_reply_at);
  const fresh = items.filter((claim) => claim.status === "new");
  const insurer = items.filter((claim) => ["submitted_to_insurer", "insurer_claim_number_assigned"].includes(claim.status));

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel brokera</p><h1>Centrum obsługi szkód</h1><p className="subtitle">Nowe zgłoszenia od administratorów i bieżący postęp spraw.</p></div></header>
    {repliedClaims.length > 0 && <section className="counterparty-replies-panel panel">
      <div className="counterparty-replies-panel__header"><div><p className="kicker">Komunikacja administratorów</p><h2><MessageCircleMore size={18}/> Odpowiedzi administratorów ({repliedClaims.length})</h2></div><span>Wybierz sprawę, aby odpowiedzieć</span></div>
      <div className="counterparty-replies-panel__list">{repliedClaims.map((claim) => <Link key={claim.id} href={`/broker/damages/${claim.id}`} className="counterparty-replies-panel__item"><span className="counterparty-replies-panel__icon"><MessageCircleMore size={17}/></span><span><strong>{claim.reference} · {claim.title}</strong><small>Odpowiedź administratora: {formatDateTime(claim.counterparty_reply_at)}</small></span></Link>)}</div>
    </section>}
    <section className="stats"><article className="stat-card"><span>Zgłoszone szkody</span><strong>{items.length}</strong></article><article className="stat-card"><span>Nowe do weryfikacji</span><strong className="warning">{fresh.length}</strong></article><article className="stat-card"><span>U ubezpieczyciela</span><strong>{insurer.length}</strong></article><article className="stat-card"><span>Wypłacone</span><strong className="success">{items.filter((claim) => claim.status === "paid").length}</strong></article></section>
    <section className="panel"><div className="panel-header"><h2>Zgłoszone szkody</h2><span className="kicker">{items.length} spraw</span></div><ClaimsTable claims={items} panel="broker"/></section>
  </AppShell>;
}
