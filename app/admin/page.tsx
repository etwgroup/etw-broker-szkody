import { PlusCircle } from "lucide-react";
import Link from "next/link";
import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { requireProfile } from "@/lib/auth";
import { demoClaimMessages, demoClaims, demoCommunities } from "@/lib/demo-data";

type Message = { claim_id: string; sender_role: "administrator" | "broker"; created_at: string };

export default async function AdminDashboard() {
  const { supabase, profile, isDemo } = await requireProfile("administrator");
  const { data: claims } = isDemo
    ? { data: null }
    : await supabase!.from("claims").select("id, reference, title, status, occurred_at, created_at, last_message_at, last_message_sender_role, communities(name, address)").order("created_at", { ascending: false });
  const { data: communities } = isDemo ? { data: null } : await supabase!.from("communities").select("id");
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
        counterparty_reply_at: latestMessage?.sender_role === "broker" ? latestMessage.created_at : undefined,
        counterparty_reply_from: "broker" as const,
      };
    })
    : (claims || []).map((claim) => ({
      ...claim,
      counterparty_reply_at: claim.last_message_sender_role === "broker" ? claim.last_message_at || undefined : undefined,
      counterparty_reply_from: "broker" as const,
    }));
  const communityCount = isDemo ? demoCommunities.length : communities?.length || 0;
  const active = items.filter((claim) => !["rejected", "paid"].includes(claim.status));

  return <AppShell profile={profile}>
    <header className="page-top"><div><p className="kicker">Panel administratora</p><h1>Dzień dobry, {profile.full_name?.split(" ")[0] || "Administratorze"}</h1><p className="subtitle">Tu zobaczysz aktualny stan wszystkich zgłoszeń.</p></div><Link className="button button-primary" href="/admin/damages/new"><PlusCircle size={16}/> Zgłoś szkodę</Link></header>
    <section className="stats"><article className="stat-card"><span>Obsługiwane wspólnoty</span><strong className="success">{communityCount}</strong></article><article className="stat-card"><span>Zgłoszone szkody</span><strong>{items.length}</strong></article><article className="stat-card"><span>Szkody w trakcie obsługi</span><strong className="warning">{active.length}</strong></article><article className="stat-card"><span>Wypłacone</span><strong className="success">{items.filter((claim) => claim.status === "paid").length}</strong></article></section>
    <section className="panel"><div className="panel-header"><h2>Ostatnio zgłoszone szkody</h2><Link href="/admin/damages/new">Nowe zgłoszenie</Link></div><ClaimsTable claims={items} showFilters/></section>
  </AppShell>;
}
