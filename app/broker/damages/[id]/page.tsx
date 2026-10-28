import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { BrokerStatusForm } from "@/components/broker-status-form";
import { ClaimConversation } from "@/components/claim-conversation";
import { ClaimDetail } from "@/components/claim-detail";
import { ClaimStatus } from "@/lib/claims";
import { requireProfile } from "@/lib/auth";
import { loadClaimConversation } from "@/lib/claim-conversation";
import { demoAttachments, demoClaimMessages, demoClaims, demoHistory } from "@/lib/demo-data";

export default async function BrokerClaimDetail({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, isDemo } = await requireProfile("broker");

  if (isDemo) {
    const claim = demoClaims.find((item) => item.id === id);
    if (!claim) notFound();
    return <AppShell profile={profile}>
      <header className="page-top"><div><Link className="kicker" href="/broker"><ArrowLeft size={12}/> Wróć do listy szkód</Link></div></header>
      <ClaimDetail claim={claim} attachments={demoAttachments} history={demoHistory}/>
      <ClaimConversation claimId={id} role="broker" messages={demoClaimMessages.filter((message) => message.claim_id === id)} demo/>
      <BrokerStatusForm claimId={id} status={claim.status as ClaimStatus} insurerClaimNumber={claim.insurer_claim_number} demo/>
    </AppShell>;
  }

  const { data: claim } = await supabase!
    .from("claims")
    .select("id, reference, title, description, status, insurer_claim_number, occurred_at, created_at, reported_by_name, reported_by_email, communities(name, address)")
    .eq("id", id)
    .single();
  if (!claim) notFound();

  const [{ data: attachments }, { data: history }, messages] = await Promise.all([
    supabase!.from("claim_attachments").select("id, file_name, mime_type, size_bytes, storage_path").eq("claim_id", id).order("created_at"),
    supabase!.from("claim_status_history").select("id, status, created_at, note").eq("claim_id", id).order("created_at", { ascending: false }),
    loadClaimConversation(supabase!, id),
  ]);
  const files = await Promise.all((attachments || []).map(async (file) => ({ ...file, url: (await supabase!.storage.from("claim-attachments").createSignedUrl(file.storage_path, 3600)).data?.signedUrl })));

  return <AppShell profile={profile}>
    <header className="page-top"><div><Link className="kicker" href="/broker"><ArrowLeft size={12}/> Wróć do listy szkód</Link></div></header>
    <ClaimDetail claim={claim} attachments={files} history={history || []}/>
    <ClaimConversation claimId={id} role="broker" messages={messages}/>
    <BrokerStatusForm claimId={id} status={claim.status as ClaimStatus} insurerClaimNumber={claim.insurer_claim_number}/>
  </AppShell>;
}
