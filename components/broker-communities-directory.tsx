"use client";

import { AlertCircle, Building2, CheckCircle2, LoaderCircle, MapPin, Pencil, Search } from "lucide-react";
import Link from "next/link";
import { FormEvent, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string };
type Community = { id: string; name: string; address: string; nip: string | null; regon: string | null; administrator_company_id: string | null };
type Notice = { kind: "success" | "error"; text: string } | null;
type EditingCommunity = { id: string; name: string; address: string; nip: string; regon: string; companyId: string };

export function BrokerCommunitiesDirectory({ communities, companies, isDemo = false }: { communities: Community[]; companies: Company[]; isDemo?: boolean }) {
  const router = useRouter();
  const [query, setQuery] = useState("");
  const [editing, setEditing] = useState<EditingCommunity | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const items = useMemo(() => {
    const normalized = query.trim().toLocaleLowerCase("pl-PL");
    if (!normalized) return communities;
    return communities.filter((community) => [community.name, community.address, community.nip, community.regon].filter(Boolean).join(" ").toLocaleLowerCase("pl-PL").includes(normalized));
  }, [communities, query]);

  const edit = (community: Community) => setEditing({ id: community.id, name: community.name, address: community.address, nip: community.nip || "", regon: community.regon || "", companyId: community.administrator_company_id || "" });
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setPending(true);
    setNotice(null);
    try {
      if (!isDemo) {
        const supabase = createClient();
        const { error } = await supabase.from("communities").update({ name: editing.name.trim(), address: editing.address.trim(), nip: editing.nip.trim() || null, regon: editing.regon.trim() || null, administrator_company_id: editing.companyId || null }).eq("id", editing.id);
        if (error) throw error;
      }
      setEditing(null);
      setNotice({ kind: "success", text: isDemo ? "Tryb demonstracyjny: dane nie są zapisywane trwale." : "Dane wspólnoty zostały zapisane." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać danych wspólnoty." });
    } finally {
      setPending(false);
    }
  };

  return <section className="broker-communities-directory">
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    {editing && <form className="community-editor panel" onSubmit={save}><div><p className="kicker">Edycja wspólnoty</p><h2>Aktualizuj dane i przypisanie</h2></div><div className="community-editor__fields"><label>Nazwa wspólnoty<input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })}/></label><label>Adres<input required value={editing.address} onChange={(event) => setEditing({ ...editing, address: event.target.value })}/></label><label>NIP <span>— opcjonalnie</span><input value={editing.nip} onChange={(event) => setEditing({ ...editing, nip: event.target.value })} inputMode="numeric"/></label><label>REGON <span>— opcjonalnie</span><input value={editing.regon} onChange={(event) => setEditing({ ...editing, regon: event.target.value })} inputMode="numeric"/></label><label>Firma administrująca<select value={editing.companyId} onChange={(event) => setEditing({ ...editing, companyId: event.target.value })}><option value="">Brak przypisania</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : "Zapisz wspólnotę"}</button><button className="button button-ghost" type="button" onClick={() => setEditing(null)}>Anuluj</button></div></form>}
    <div className="community-toolbar"><Search size={17}/><input aria-label="Wyszukaj wspólnotę" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Wyszukaj po nazwie, adresie, NIP lub REGON…"/><span>{items.length} z {communities.length}</span></div>
    {items.length ? <section className="communities-grid">{items.map((community) => <article className="community-card broker-community-card" key={community.id}><Link href={`/broker/communities/${community.id}`}><span className="community-icon"><Building2 size={19}/></span><div><h2>{community.name}</h2><p><MapPin size={13}/>{community.address}</p>{community.nip && <small>NIP: {community.nip}</small>}{community.regon && <small>REGON: {community.regon}</small>}</div></Link><div className="broker-community-card__footer"><span>{companies.find((company) => company.id === community.administrator_company_id)?.name || "Nieprzypisana do firmy"}</span><button className="button button-ghost" type="button" onClick={() => edit(community)}><Pencil size={13}/>Edytuj</button></div></article>)}</section> : <div className="empty-state"><Search size={25}/><p>Nie znaleziono wspólnot spełniających kryteria wyszukiwania.</p></div>}
  </section>;
}
