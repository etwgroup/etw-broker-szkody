import { ArrowLeft, CalendarDays, Download, FileCheck2, FileWarning, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AppShell } from "@/components/app-shell";
import { ClaimsTable } from "@/components/claims-table";
import { CommunityEditForm } from "@/components/community-edit-form";
import { PolicyArchive } from "@/components/policy-archive";
import { PolicyUploadForm } from "@/components/policy-upload-form";
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
  communities: { name: string; address: string } | { name: string; address: string }[];
};

export default async function BrokerCommunityDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { supabase, profile, isDemo } = await requireProfile("broker");

  if (isDemo) {
    const community = demoCommunities.find((item) => item.id === id);
    if (!community) notFound();
    return <BrokerCommunityDetail
      profile={profile}
      community={{ ...community, nip: null, regon: null, administrator_company_id: "demo-company" }}
      companies={[{ id: "demo-company", name: "ETW Administracja" }]}
      isDemo
      policies={demoPolicies.filter((item) => item.community_id === id)}
      claims={demoClaims.filter((item) => item.communities.id === id)}
    />;
  }

  const { data: community } = await supabase!
    .from("communities")
    .select("id, name, address, nip, regon, administrator_company_id")
    .eq("id", id)
    .single();
  if (!community) notFound();

  const [{ data: policies }, { data: claims }, { data: companies }] = await Promise.all([
    supabase!
      .from("insurance_policies")
      .select("id, insurer, policy_number, valid_from, valid_to, file_name, storage_path, created_at")
      .eq("community_id", id)
      .order("valid_to", { ascending: false })
      .order("created_at", { ascending: false }),
    supabase!
      .from("claims")
      .select("id, reference, title, status, occurred_at, created_at, communities(name, address)")
      .eq("community_id", id)
      .order("created_at", { ascending: false }),
    supabase!.from("administrator_companies").select("id, name").order("name"),
  ]);

  const policiesWithUrls = await Promise.all(((policies || []) as InsurancePolicy[]).map(async (policy) => {
    if (!policy.storage_path) return policy;
    const { data } = await supabase!.storage.from("policy-documents").createSignedUrl(policy.storage_path, 3600);
    return { ...policy, download_url: data?.signedUrl };
  }));

  return <BrokerCommunityDetail
    profile={profile}
    community={community}
    companies={companies || []}
    policies={policiesWithUrls}
    claims={claims || []}
  />;
}

function BrokerCommunityDetail({
  profile,
  community,
  companies,
  isDemo = false,
  policies,
  claims,
}: {
  profile: Awaited<ReturnType<typeof requireProfile>>["profile"];
  community: { id: string; name: string; address: string; nip?: string | null; regon?: string | null; administrator_company_id?: string | null };
  companies: Array<{ id: string; name: string }>;
  isDemo?: boolean;
  policies: InsurancePolicy[];
  claims: CommunityClaim[];
}) {
  const currentPolicy = getCurrentPolicy(policies);
  const archivedPolicies = policies.filter((policy) => policy.id !== currentPolicy?.id);

  return <AppShell profile={profile}>
    <header className="page-top">
      <div>
        <Link className="kicker" href="/broker/communities"><ArrowLeft size={12}/> Wróć do wspólnot</Link>
        <h1>{community.name}</h1>
        <p className="subtitle">{community.address}{community.nip ? ` · NIP ${community.nip}` : ""}{community.regon ? ` · REGON ${community.regon}` : ""}</p>
      </div>
    </header>

    <CommunityEditForm community={community} companies={companies} isDemo={isDemo}/>

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
        </> : <div className="policy-empty"><FileWarning size={25}/><div><strong>Brak aktualnej polisy</strong><p>Dodaj dokumentację polisy dla tej wspólnoty.</p></div></div>}
      </section>
      <section className="community-note"><FileCheck2 size={19}/><h3>Widok brokera</h3><p>Dodaj nową polisę poniżej. Wcześniejsze dokumenty pozostaną dostępne w archiwum.</p></section>
    </div>

    <PolicyUploadForm communityId={community.id} isDemo={isDemo}/>
    <PolicyArchive policies={archivedPolicies}/>

    <section className="panel claims-by-community">
      <div className="panel-header"><h2>Zgłoszone szkody ({claims.length})</h2></div>
      {claims.length ? <ClaimsTable claims={claims} panel="broker"/> : <div className="empty-state"><FileCheck2 size={25}/><p>Ta wspólnota nie ma jeszcze zgłoszonych szkód.</p></div>}
    </section>
  </AppShell>;
}
