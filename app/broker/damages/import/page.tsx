import Link from "next/link";
import { ArrowLeft, Info } from "lucide-react";
import { AppShell } from "@/components/app-shell";
import { HistoricalClaimForm } from "@/components/historical-claim-form";
import { demoCommunities } from "@/lib/demo-data";
import { requireProfile } from "@/lib/auth";

export default async function ImportHistoricalClaimPage() {
  const { supabase, profile, isDemo } = await requireProfile("broker");
  const { data: communities } = isDemo
    ? { data: null }
    : await supabase!.from("communities").select("id, name, address").order("name");
  const availableCommunities = isDemo ? demoCommunities : communities || [];

  return <AppShell profile={profile}>
    <header className="page-top">
      <div>
        <Link className="kicker" href="/broker"><ArrowLeft size={12}/> Wróć do szkód</Link>
        <h1>Dodaj już zgłoszone szkody</h1>
        <p className="subtitle">Wprowadź sprawy prowadzone przed uruchomieniem platformy ETW Broker.</p>
      </div>
    </header>
    <div className="two-column">
      <HistoricalClaimForm communities={availableCommunities} demo={isDemo}/>
      <aside className="side-tip"><Info size={19}/><h3>Szkoda będzie widoczna dla wspólnoty</h3><p>Wybór wspólnoty automatycznie udostępnia sprawę wszystkim kontom administratora przypisanym do firmy obsługującej tę wspólnotę.</p></aside>
    </div>
  </AppShell>;
}
