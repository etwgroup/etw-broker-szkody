"use client";

import { AlertCircle, Building2, CheckCircle2, ClipboardList, LoaderCircle, Pencil, Plus, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string; nip: string | null; accountCount: number; communityCount: number };
type Notice = { kind: "success" | "error"; text: string } | null;
const blankCompany = { name: "", nip: "" };

function communityWord(count: number) {
  return count === 1 ? "wspólnota" : count % 10 >= 2 && count % 10 <= 4 && (count < 10 || count > 20) ? "wspólnoty" : "wspólnot";
}

export function AdministratorCompanyManager({ companies, isDemo = false }: { companies: Company[]; isDemo?: boolean }) {
  const router = useRouter();
  const [newCompany, setNewCompany] = useState(blankCompany);
  const [editing, setEditing] = useState<Company | null>(null);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const saveCompany = async (event: FormEvent<HTMLFormElement>, mode: "create" | "edit") => {
    event.preventDefault();
    const editingCompany = editing;
    if (mode === "edit" && !editingCompany) return;
    setNotice(null);
    setPending(true);
    try {
      if (!isDemo) {
        const supabase = createClient();
        const values = mode === "create"
          ? { name: newCompany.name.trim(), nip: newCompany.nip.trim() || null }
          : { name: editingCompany!.name.trim(), nip: editingCompany!.nip?.trim() || null };
        const { error } = mode === "create"
          ? await supabase.from("administrator_companies").insert(values)
          : await supabase.from("administrator_companies").update(values).eq("id", editingCompany!.id);
        if (error) throw error;
      }
      if (mode === "create") setNewCompany(blankCompany); else setEditing(null);
      setNotice({ kind: "success", text: isDemo ? "Tryb demonstracyjny: dane nie są zapisywane trwale." : mode === "create" ? "Firma administrująca została dodana." : "Dane firmy zostały zapisane." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać danych firmy." });
    } finally {
      setPending(false);
    }
  };

  return <section className="company-manager panel">
    <div className="company-manager__heading"><span><Building2 size={19}/></span><div><p className="kicker">Firmy administrujące</p><h2>Dodaj lub edytuj firmę</h2><p>Firmę można utworzyć niezależnie od kont użytkowników.</p></div></div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    <form className="company-manager__form" onSubmit={(event) => saveCompany(event, "create")}><label>Nazwa firmy<input required value={newCompany.name} onChange={(event) => setNewCompany({ ...newCompany, name: event.target.value })} placeholder="np. ABC Zarządzanie Nieruchomościami"/></label><label>NIP firmy <span>— opcjonalnie</span><input value={newCompany.nip} onChange={(event) => setNewCompany({ ...newCompany, nip: event.target.value })} inputMode="numeric" placeholder="0000000000"/></label><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : <Plus size={16}/>}Dodaj firmę</button></form>
    {editing && <form className="company-manager__form company-manager__form--edit" onSubmit={(event) => saveCompany(event, "edit")}><label>Nazwa firmy<input required value={editing.name} onChange={(event) => setEditing({ ...editing, name: event.target.value })}/></label><label>NIP firmy <span>— opcjonalnie</span><input value={editing.nip || ""} onChange={(event) => setEditing({ ...editing, nip: event.target.value })} inputMode="numeric"/></label><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : "Zapisz zmiany"}</button><button className="button button-ghost" type="button" onClick={() => setEditing(null)}>Anuluj</button></form>}
    <div className="company-manager__list">{companies.map((company) => <article key={company.id} className="community-card administrator-card"><span className="community-icon"><Building2 size={20}/></span><div><h3>{company.name}</h3><p><ClipboardList size={13}/>{company.communityCount} {communityWord(company.communityCount)} w obsłudze</p><small><UsersRound size={11}/>{company.accountCount} {company.accountCount === 1 ? "konto administratora" : "kont administratorów"}{company.nip ? ` · NIP ${company.nip}` : ""}</small><button type="button" className="text-button" onClick={() => setEditing(company)}><Pencil size={13}/> Edytuj firmę</button></div></article>)}</div>
  </section>;
}
