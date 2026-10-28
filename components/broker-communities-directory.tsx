"use client";

import { AlertCircle, Building2, CheckCircle2, LoaderCircle, MapPin, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string };
type Community = { id: string; name: string; address: string; nip: string | null; regon: string | null; administrator_company_id: string | null };
type Notice = { kind: "success" | "error"; text: string } | null;

export function BrokerCommunitiesDirectory({ communities, companies }: { communities: Community[]; companies: Company[] }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [choices, setChoices] = useState<Record<string, string>>({});
  const [assignedCompanies, setAssignedCompanies] = useState<Record<string, string>>({});
  const [notices, setNotices] = useState<Record<string, Notice>>({});
  const [pendingCommunityId, setPendingCommunityId] = useState<string | null>(null);
  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pl-PL");
    if (!normalized) return communities;
    return communities.filter((community) => [community.name, community.address, community.nip, community.regon].filter(Boolean).join(" ").toLocaleLowerCase("pl-PL").includes(normalized));
  }, [communities, query]);

  const assignCompany = async (event: FormEvent<HTMLFormElement>, communityId: string) => {
    event.preventDefault();
    const companyId = choices[communityId];
    if (!companyId) {
      setNotices((current) => ({ ...current, [communityId]: { kind: "error", text: "Wybierz firmę administrującą." } }));
      return;
    }

    setPendingCommunityId(communityId);
    setNotices((current) => ({ ...current, [communityId]: null }));
    try {
      const supabase = createClient();
      const { error } = await supabase.from("communities").update({ administrator_company_id: companyId }).eq("id", communityId);
      if (error) throw error;
      setAssignedCompanies((current) => ({ ...current, [communityId]: companyId }));
      setNotices((current) => ({ ...current, [communityId]: { kind: "success", text: "Firma została przypisana do wspólnoty." } }));
      router.refresh();
    } catch (error) {
      setNotices((current) => ({ ...current, [communityId]: { kind: "error", text: error instanceof Error ? error.message : "Nie udało się przypisać firmy." } }));
    } finally {
      setPendingCommunityId(null);
    }
  };

  return <section className="broker-communities-directory">
    <div className="community-toolbar"><Search size={17}/><input aria-label="Wyszukaj wspólnotę" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wyszukaj po nazwie, adresie, NIP lub REGON…"/><span>{items.length} z {communities.length}</span></div>
    {items.length ? <section className="communities-grid">{items.map((community) => {
      const companyId = assignedCompanies[community.id] ?? community.administrator_company_id;
      const company = companies.find((item) => item.id === companyId);
      const notice = notices[community.id];
      const isPending = pendingCommunityId === community.id;
      return <article className="community-card broker-community-card" key={community.id}>
        <Link className="broker-community-card__link" href={`/broker/communities/${community.id}`}>
          <span className="community-icon"><Building2 size={19}/></span>
          <div><h2>{community.name}</h2><p><MapPin size={13}/>{community.address}</p>{community.nip && <small>NIP: {community.nip}</small>}{community.regon && <small>REGON: {community.regon}</small>}<span className="broker-community-card__company">{company?.name || "Nieprzypisana do firmy"}</span></div>
        </Link>
        {!companyId && <div className="broker-community-card__assignment">
          {companies.length ? <form onSubmit={(event) => assignCompany(event, community.id)}>
            <label htmlFor={`company-${community.id}`}>Przypisz firmę obsługującą</label>
            <div><select id={`company-${community.id}`} value={choices[community.id] || ""} onChange={(event) => setChoices((current) => ({ ...current, [community.id]: event.target.value }))} disabled={isPending}><option value="">Wybierz firmę…</option>{companies.map((item) => <option key={item.id} value={item.id}>{item.name}</option>)}</select><button className="button button-primary" type="submit" disabled={isPending}>{isPending ? <LoaderCircle className="spin" size={15}/> : "Przypisz"}</button></div>
          </form> : <p>Najpierw dodaj firmę w zakładce „Obsługiwani Administratorzy”.</p>}
          {notice && <p className={`broker-community-card__notice broker-community-card__notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {notice.text}</p>}
        </div>}
      </article>;
    })}</section> : <div className="empty-state"><Search size={25}/><p>Nie znaleziono wspólnot spełniających kryteria wyszukiwania.</p></div>}
  </section>;
}
