import { MessageCircleMore, PlusCircle } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { formatDateTime } from "@/lib/claims";
import { requireProfile } from "@/lib/auth";
import { demoClaimMessages, demoClaims, demoCommunities } from "@/lib/demo-data";

type Reply = { claim_id: string; created_at: string };

export default async function AdminDashboard() {
  const { supabase, profile, isDemo } = await requireProfile("administrator");
  const { data: claims } = isDemo
    ? { data: null }
    : await supabase!.from("claims").select("id, reference, title, status, occurred_at, created_at, communities(name, address)").order("created_at", { ascending: false });
  const { data: communities } = isDemo ? { data: null } : await supabase!.from("communities").select("id");
  const baseItems = isDemo ? demoClaims : claims || [];
  const claimIds = baseItems.map((claim) => claim.id);
  const { data: brokerMessages } = isDemo || !claimIds.length
    ? { data: null }
    : await supabase!.from("claim_messages").select("claim_id, created_at").eq("sender_role", "broker").in("claim_id", claimIds).order("created_at", { ascending: false });
  const replies: Reply[] = isDemo
    ? demoClaimMessages.filter((message) => message.sender_role === "broker").map((message) => ({ claim_id: message.claim_id, created_at: message.created_at }))
    : (brokerMessages || []) as Reply[];
  const latestReplyByClaim = new Map<string, Reply>();
  replies.forEach((reply) => {
    if (!latestReplyByClaim.has(reply.claim_id)) latestReplyByClaim.set(reply.claim_id, reply);
  });
  const items = baseItems.map((claim) => ({ ...claim, counterparty_reply_at: latestReplyByClaim.get(claim.id)?.created_at, counterparty_reply_from: "broker" as const }));
  const repliedClaims = items.filter((claim) => claim.counterparty_reply_at);
  const communityCount = isDemo ? demoCommunities.length : communities?.length || 0;
  const active = items.filter((claim) => !["rejected", "paid"].includes(claim.status));

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel administratora</p><h1>Dzień dobry, {profile.full_name?.split(" ")[0] || "Administratorze"}</h1><p className="subtitle">Tu zobaczysz aktualny stan wszystkich zgłoszeń.</p></div><Link className="button button-primary" href="/admin/damages/new"><PlusCircle size={16}/> Zgłoś szkodę</Link></header>
    {repliedClaims.length > 0 && <section className="counterparty-replies-panel panel">
      <div className="counterparty-replies-panel__header"><div><p className="kicker">Komunikacja brokera</p><h2><MessageCircleMore size={18}/> Odpowiedzi brokera ({repliedClaims.length})</h2></div><span>Wybierz sprawę, aby odpowiedzieć</span></div>
      <div className="counterparty-replies-panel__list">{repliedClaims.map((claim) => <Link key={claim.id} href={`/admin/damages/${claim.id}`} className="counterparty-replies-panel__item"><span className="counterparty-replies-panel__icon"><MessageCircleMore size={17}/></span><span><strong>{claim.reference} · {claim.title}</strong><small>Odpowiedź brokera: {formatDateTime(claim.counterparty_reply_at)}</small></span></Link>)}</div>
    </section>}
    <section className="stats"><article className="stat-card"><span>Obsługiwane wspólnoty</span><strong className="success">{communityCount}</strong></article><article className="stat-card"><span>Zgłoszone szkody</span><strong>{items.length}</strong></article><article className="stat-card"><span>Szkody w trakcie obsługi</span><strong className="warning">{active.length}</strong></article><article className="stat-card"><span>Wypłacone</span><strong className="success">{items.filter((claim) => claim.status === "paid").length}</strong></article></section>
    <section className="panel"><div className="panel-header"><h2>Ostatnio zgłoszone szkody</h2><Link href="/admin/damages/new">Nowe zgłoszenie</Link></div><ClaimsTable claims={items}/></section>
  </AppShell>;
}
