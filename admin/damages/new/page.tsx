import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { ClaimForm } from "@/components/claim-form";
import { requireProfile } from "@/lib/auth";
import { demoCommunities } from "@/lib/demo-data";

export default async function NewClaimPage({ searchParams }: { searchParams: Promise<{ community?: string | string[] }> }) {
  const query = await searchParams;
  const { supabase, profile, isDemo } = await requireProfile("administrator");
  const { data: communities } = isDemo ? { data: null } : await supabase!.from("communities").select("id, name, address").order("name");
  const availableCommunities = isDemo ? demoCommunities : communities || [];
  const requestedCommunityId = Array.isArray(query.community) ? query.community[0] : query.community;
  const defaultCommunityId = availableCommunities.some((community) => community.id === requestedCommunityId) ? requestedCommunityId : undefined;
  return <AppShell profile={profile}><header className="page-top"><div><Link className="kicker" href="/admin"><ArrowLeft size={12}/> Wróć do pulpitu</Link><h1>Zgłoś szkodę</h1><p className="subtitle">Wprowadź dane zdarzenia i dołącz dostępną dokumentację.</p></div></header><div className="two-column"><ClaimForm communities={availableCommunities} defaultCommunityId={defaultCommunityId} demo={isDemo}/><aside className="side-tip"><Info size={19}/><h3>Co warto dołączyć?</h3><p>Zdjęcia miejsca zdarzenia, dokumentację od zarządcy, faktury za pierwsze prace zabezpieczające oraz kosztorysy.</p></aside></div></AppShell>;
}
