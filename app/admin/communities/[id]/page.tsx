import { ArrowLeft, CalendarDays, Download, FileCheck2, FileWarning, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { formatDate } from "@/lib/claims";
import { requireProfile } from "@/lib/auth";
import { demoClaims, demoCommunities, demoPolicies } from "@/lib/demo-data";

type Policy = { id: string; insurer: string; policy_number: string; valid_from: string; valid_to: string; file_name: string | null; storage_path?: string; download_url?: string };

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, isDemo } = await requireProfile("administrator");
  if (isDemo) {
    const community = demoCommunities.find((item) => item.id === id);
    if (!community) notFound();
    const policy = demoPolicies.find((item) => item.community_id === id) || null;
    const claims = demoClaims.filter((item) => item.communities.id === id);
    return <CommunityDetail profile={profile} community={community} policy={policy} claims={claims} />;
  }
  const { data: community } = await supabase!.from("communities").select("id, name, address, nip").eq("id", id).single();
  if (!community) notFound();
  const [{ data: policies }, { data: claims }] = await Promise.all([
    supabase!.from("insurance_policies").select("id, insurer, policy_number, valid_from, valid_to, file_name, storage_path").eq("community_id", id).order("valid_to", { ascending: false }).limit(1),
    supabase!.from("claims").select("id, reference, title, status, occurred_at, created_at, communities(name, address)").eq("community_id", id).order("created_at", { ascending: false }),
  ]);
  const policy = policies?.[0] || null;
  let policyWithUrl: Policy | null = policy;
  if (policy?.storage_path) {
    const { data } = await supabase!.storage.from("policy-documents").createSignedUrl(policy.storage_path, 3600);
    policyWithUrl = { ...policy, download_url: data?.signedUrl };
  }
  return <CommunityDetail profile={profile} community={community} policy={policyWithUrl} claims={claims || []} />;
}

function CommunityDetail({ profile, community, policy, claims }: { profile: Awaited<ReturnType<typeof requireProfile>>["profile"]; community: { id: string; name: string; address: string; nip?: string | null }; policy: Policy | null; claims: Array<{ id: string; reference: string; title: string; status: string; occurred_at: string; created_at: string; communities: { name: string; address: string } | { name: string; address: string }[] }> }) {
  return <AppShell profile={profile}><header className="page-top"><div><Link className="kicker" href="/admin/communities"><ArrowLeft size={12}/> Wróć do listy wspólnot</Link><h1>{community.name}</h1><p className="subtitle">{community.address}{community.nip ? ` · NIP ${community.nip}` : ""}</p></div></header><div className="community-detail-grid"><section className="policy-panel"><div className="policy-heading"><span><ShieldCheck size={21}/></span><div><p className="kicker">Ochrona ubezpieczeniowa</p><h2>Aktualna polisa</h2></div></div>{policy ? <><dl className="policy-data"><div><dt>Ubezpieczyciel</dt><dd>{policy.insurer}</dd></div><div><dt>Numer polisy</dt><dd>{policy.policy_number}</dd></div><div><dt>Okres ochrony</dt><dd><CalendarDays size={13}/>{formatDate(policy.valid_from)} – {formatDate(policy.valid_to)}</dd></div></dl>{policy.download_url ? <a className="button button-primary" href={policy.download_url} download={policy.file_name || "polisa.pdf"}><Download size={16}/> Pobierz polisę</a> : <p className="error-message">Plik polisy nie jest obecnie dostępny do pobrania.</p>}</> : <div className="policy-empty"><FileWarning size={25}/><div><strong>Brak aktualnej polisy</strong><p>Skontaktuj się z brokerem, aby uzupełnić dokument.</p></div></div>}</section><section className="community-note"><FileCheck2 size={19}/><h3>Dokumenty wspólnoty</h3><p>Polisa jest dostępna dla kont przypisanych do firmy administrującej oraz dla brokera.</p></section></div><section className="panel claims-by-community"><div className="panel-header"><h2>Zgłoszone szkody ({claims.length})</h2></div>{claims.length ? <ClaimsTable claims={claims}/> : <div className="empty-state"><FileCheck2 size={25}/><p>Ta wspólnota nie ma jeszcze zgłoszonych szkód.</p></div>}</section></AppShell>;
}
