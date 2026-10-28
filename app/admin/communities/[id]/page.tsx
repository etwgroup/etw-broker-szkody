import { ArrowLeft, CalendarDays, Download, FileCheck2, FileWarning, PlusCircle, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { CommunityLossSummary } from "@/components/community-loss-summary";
import { PolicyArchive } from "@/components/policy-archive";
import { formatDate } from "@/lib/claims";
import { requireProfile } from "@/lib/auth";
import { demoClaims, demoCommunities, demoPolicies } from "@/lib/demo-data";
import { getCurrentPolicy, type InsurancePolicy } from "@/lib/policies";

type CommunityClaim = {
  id: string;
  reference: string;
  title: string;
  status: string;
  occurred_at: string;
  created_at: string;
  paid_amount?: string | number | null;
  paid_at?: string | null;
  communities: { name: string; address: string } | { name: string; address: string }[];
};

export default async function CommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, isDemo } = await requireProfile("administrator");

  if (isDemo) {
    const community = demoCommunities.find((item) => item.id === id);
    if (!community) notFound();
    return <CommunityDetail
      profile={profile}
      community={community}
      policies={demoPolicies.filter((item) => item.community_id === id)}
      claims={demoClaims.filter((item) => item.communities.id === id)}
    />;
  }

  const { data: community } = await supabase!
    .from("communities")
    .select("id, name, address, nip, regon")
    .eq("id", id)
    .single();
  if (!community) notFound();

  const [{ data: policies }, { data: claims }] = await Promise.all([
    supabase!
      .from("insurance_policies")
      .select("id, insurer, policy_number, valid_from, valid_to, file_name, storage_path, created_at")
      .eq("community_id", id)
      .order("valid_to", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase!
      .from("claims")
      .select("id, reference, title, status, occurred_at, created_at, paid_amount, paid_at, communities(name, address)")
      .eq("community_id", id)
      .order("created_at", { ascending: false }),
  ]);

  const policiesWithUrls = await Promise.all(((policies || []) as InsurancePolicy[]).map(async (policy) => {
    if (!policy.storage_path) return policy;
    const { data } = await supabase!.storage.from("policy-documents").createSignedUrl(policy.storage_path, 3600);
    return { ...policy, download_url: data?.signedUrl };
  }));

  return <CommunityDetail profile={profile} community={community} policies={policiesWithUrls} claims={claims || []}/>;
}

function CommunityDetail({
  profile,
  community,
  policies,
  claims,
}: {
  profile: Awaited<ReturnType<typeof requireProfile>>["profile"];
  community: { id: string; name: string; address: string; nip?: string | null; regon?: string | null };
  policies: InsurancePolicy[];
  claims: CommunityClaim[];
}) {
  const currentPolicy = getCurrentPolicy(policies);
  const archivedPolicies = policies.filter((policy) => policy.id !== currentPolicy?.id);

  return <AppShell profile={profile}>
    <header className="page-top">
      <div>
        <Link className="kicker" href="/admin/communities"><ArrowLeft size={12}/> Wróć do listy wspólnot</Link>
        <h1>{community.name}</h1>
        <p className="subtitle">{community.address}{community.nip ? ` · NIP ${community.nip}` : ""}{community.regon ? ` · REGON ${community.regon}` : ""}</p>
      </div>
      <Link className="button button-primary" href={`/admin/damages/new?community=${encodeURIComponent(community.id)}`}><PlusCircle size={16}/> Zgłoś szkodę</Link>
    </header>

    <div className="community-detail-grid">
      <section className="policy-panel">
        <div className="policy-heading">
          <span><ShieldCheck size={21}/></span>
          <div><p className="kicker">Ochrona ubezpieczeniowa</p><h2>Aktualna polisa</h2></div>
        </div>
        {currentPolicy ? <>
          <dl className="policy-data">
            <div><dt>Ubezpieczyciel</dt><dd>{currentPolicy.insurer}</dd></div>
            <div><dt>Numer polisy</dt><dd>{currentPolicy.policy_number}</dd></div>
            <div><dt>Okres ochrony</dt><dd><CalendarDays size={13}/>{formatDate(currentPolicy.valid_from)} – {formatDate(currentPolicy.valid_to)}</dd></div>
          </dl>
          {currentPolicy.download_url ? <a className="button button-primary" href={currentPolicy.download_url} download={currentPolicy.file_name || "polisa.pdf"}><Download size={16}/> Pobierz polisę</a> : <p className="error-message">Plik polisy nie jest obecnie dostępny do pobrania.</p>}
        </> : <div className="policy-empty"><FileWarning size={25}/><div><strong>Brak aktualnej polisy</strong><p>Skontaktuj się z brokerem, aby uzupełnić dokument.</p></div></div>}
      </section>
      <section className="community-note"><FileCheck2 size={19}/><h3>Dokumenty wspólnoty</h3><p>Polisa i jej archiwum są dostępne dla wszystkich kont przypisanych do firmy administrującej.</p></section>
    </div>

    <PolicyArchive policies={archivedPolicies}/>

    <CommunityLossSummary claims={claims}/>

    <section className="panel claims-by-community">
      <div className="panel-header"><h2>Zgłoszone szkody ({claims.length})</h2></div>
      {claims.length ? <ClaimsTable claims={claims}/> : <div className="empty-state"><FileCheck2 size={25}/><p>Ta wspólnota nie ma jeszcze zgłoszonych szkód.</p></div>}
    </section>
  </AppShell>;
}
