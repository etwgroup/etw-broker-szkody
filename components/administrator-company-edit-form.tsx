"use client";

import { AlertCircle, Building2, CheckCircle2, LoaderCircle } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyLogoPicker } from "@/components/company-logo-picker";
import { removeCompanyLogo, uploadCompanyLogo } from "@/lib/company-logo";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string; nip?: string | null; logo_path?: string | null; logoUrl?: string | null };
type Notice = { kind: "success" | "error"; text: string } | null;

export function AdministratorCompanyEditForm({ company, isDemo = false }: { company: Company; isDemo?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState({ name: company.name, nip: company.nip || "" });
  const [logo, setLogo] = useState<File | null>(null);
  const [removeCurrentLogo, setRemoveCurrentLogo] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setPending(true);
    try {
      if (!isDemo) {
        const supabase = createClient();
        let nextLogoPath = company.logo_path || null;
        let uploadedLogoPath: string | null = null;
        if (logo) {
          uploadedLogoPath = await uploadCompanyLogo(supabase, company.id, logo);
          nextLogoPath = uploadedLogoPath;
        } else if (removeCurrentLogo) {
          nextLogoPath = null;
        }

        const { error } = await supabase.from("administrator_companies").update({
          name: form.name.trim(),
          nip: form.nip.trim() || null,
          logo_path: nextLogoPath,
        }).eq("id", company.id);
        if (error) {
          if (uploadedLogoPath) await removeCompanyLogo(supabase, uploadedLogoPath).catch(() => undefined);
          throw error;
        }

        if ((logo || removeCurrentLogo) && company.logo_path && company.logo_path !== nextLogoPath) {
          await removeCompanyLogo(supabase, company.logo_path).catch(() => undefined);
        }
      }
      setLogo(null);
      setRemoveCurrentLogo(false);
      setNotice({ kind: "success", text: isDemo ? "Tryb demonstracyjny: dane nie są zapisywane trwale." : "Dane firmy zostały zapisane." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać danych firmy." });
    } finally {
      setPending(false);
    }
  };

  return <section className="company-editor panel"><div><p className="kicker">Dane firmy</p><h2><Building2 size={16}/> Edytuj firmę administrującą</h2></div>{notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}<form className="company-editor__fields" onSubmit={save}><label>Nazwa firmy<input required value={form.name} onChange={(event) => setForm({ ...form, name: event.target.value })}/></label><label>NIP firmy <span>— opcjonalnie</span><input value={form.nip} onChange={(event) => setForm({ ...form, nip: event.target.value })} inputMode="numeric"/></label><CompanyLogoPicker id={`company-logo-${company.id}`} value={logo} currentLogoUrl={company.logoUrl} currentLogoWillBeRemoved={removeCurrentLogo} allowCurrentRemoval onChange={setLogo} onCurrentRemovalChange={setRemoveCurrentLogo} onValidationError={(message) => setNotice(message ? { kind: "error", text: message } : null)} disabled={pending}/><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : "Zapisz firmę"}</button></form></section>;
}
