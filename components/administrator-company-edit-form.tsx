"use client";

import { AlertCircle, Building2, CheckCircle2, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string; nip?: string | null };
type Notice = { kind: "success" | "error"; text: string } | null;

export function AdministratorCompanyEditForm({ company, isDemo = false }: { company: Company; isDemo?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: company.name, nip: company.nip || "" });
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setPending(true);
    try {
      if (!isDemo) {
        const supabase = createClient();
        const { error } = await supabase.from("administrator_companies").update({ name: form.name.trim(), nip: form.nip.trim() || null }).eq("id", company.id);
        if (error) throw error;
      }
      setNotice({ kind: "success", text: isDemo ? "Tryb demonstracyjny: dane nie są zapisywane trwale." : "Dane firmy zostały zapisane." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać danych firmy." });
    } finally {
      setPending(false);
    }
  };

  return <section className="company-editor panel"><div><p className="kicker">Dane firmy</p><h2><Building2 size={16}/> Edytuj firmę administrującą</h2></div>{notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}<form className="company-editor__fields" onSubmit={save}><label>Nazwa firmy<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>NIP firmy <span>— opcjonalnie</span><input value={form.nip} onChange={(event) => setForm({ ...form, nip: event.target.value })} inputMode="numeric"/></label><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : "Zapisz firmę"}</button></form></section>;
}
