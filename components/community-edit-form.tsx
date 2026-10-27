"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, Pencil } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string };
type Community = { id: string; name: string; address: string; nip?: string | null; regon?: string | null; administrator_company_id?: string | null };
type Notice = { kind: "success" | "error"; text: string } | null;

export function CommunityEditForm({ community, companies, isDemo = false }: { community: Community; companies: Company[]; isDemo?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: community.name, address: community.address, nip: community.nip || "", regon: community.regon || "", companyId: community.administrator_company_id || "" });
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setNotice(null);
    try {
      if (!isDemo) {
        const supabase = createClient();
        const { error } = await supabase.from("communities").update({ name: form.name.trim(), address: form.address.trim(), nip: form.nip.trim() || null, regon: form.regon.trim() || null, administrator_company_id: form.companyId || null }).eq("id", community.id);
        if (error) throw error;
      }
      setNotice({ kind: "success", text: isDemo ? "Tryb demonstracyjny: dane nie są zapisywane trwale." : "Dane wspólnoty zostały zapisane." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać danych wspólnoty." });
    } finally {
      setPending(false);
    }
  };

  return <section className="community-editor panel">
    <div><p className="kicker">Dane wspólnoty</p><h2><Pencil size={16}/> Edytuj wspólnotę</h2></div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    <form className="community-editor__fields" onSubmit={save}><label>Nazwa wspólnoty<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>Adres<input required value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })}/></label><label>NIP <span>— opcjonalnie</span><input value={form.nip} onChange={(event) => setForm({ ...form, nip: event.target.value })} inputMode="numeric"/></label><label>REGON <span>— opcjonalnie</span><input value={form.regon} onChange={(event) => setForm({ ...form, regon: event.target.value })} inputMode="numeric"/></label><label>Firma administrująca<select value={form.companyId} onChange={(event) => setForm({ ...form, companyId: event.target.value })}><option value="">Brak przypisania</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : "Zapisz wspólnotę"}</button></form>
  </section>;
}
