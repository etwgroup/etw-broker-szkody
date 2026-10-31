"use client";

import { AlertCircle, Building2, CheckCircle2, ClipboardList, LoaderCircle, Plus, UsersRound } from "lucide-react";
import Link from "next/link";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";
import { CompanyLogoPicker } from "@/components/company-logo-picker";
import { removeCompanyLogo, uploadCompanyLogo } from "@/lib/company-logo";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string; nip: string | null; logoUrl?: string | null; accountCount: number; communityCount: number };
type Notice = { kind: "success" | "error"; text: string } | null;
const blankCompany = { name: "", nip: "", logo: null as File | null };

function communityWord(count: number) {
  return count === 1 ? "wspólnota" : count % 10 >= 2 && count % 10 <= 4 && (count < 10 || count > 20) ? "wspólnoty" : "wspólnot";
}

export function AdministratorCompanyManager({ companies, isDemo = false }: { companies: Company[]; isDemo?: boolean }) {
  const router = useRouter();
  const [newCompany, setNewCompany] = useState(blankCompany);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const saveCompany = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setPending(true);
    try {
      if (!isDemo) {
        const supabase = createClient();
        const { data: company, error: companyError } = await supabase
          .from("administrator_companies")
          .insert({ name: newCompany.name.trim(), nip: newCompany.nip.trim() || null })
          .select("id")
          .single();
        if (companyError || !company) throw companyError || new Error("Nie udało się dodać firmy.");

        let uploadedLogoPath: string | null = null;
        try {
          if (newCompany.logo) {
            uploadedLogoPath = await uploadCompanyLogo(supabase, company.id, newCompany.logo);
            const { error: logoUpdateError } = await supabase.from("administrator_companies").update({ logo_path: uploadedLogoPath }).eq("id", company.id);
            if (logoUpdateError) throw logoUpdateError;
          }
        } catch (uploadError) {
          if (uploadedLogoPath) await removeCompanyLogo(supabase, uploadedLogoPath).catch(() => undefined);
          await supabase.from("administrator_companies").delete().eq("id", company.id);
          throw uploadError;
        }
      }
      setNewCompany(blankCompany);
      setNotice({ kind: "success", text: isDemo ? "Tryb demonstracyjny: dane nie są zapisywane trwale." : "Firma administrująca została dodana." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać danych firmy." });
    } finally {
      setPending(false);
    }
  };

  return <section className="company-manager panel">
    <div className="company-manager__heading"><span><Building2 size={19}/></span><div><p className="kicker">Firmy administrujące</p><h2>Dodaj firmę</h2><p>Firmę można utworzyć niezależnie od kont użytkowników. Jej dane edytujesz po wejściu w kartę firmy.</p></div></div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    <form className="company-manager__form" onSubmit={saveCompany}>
      <label>Nazwa firmy<input required value={newCompany.name} onChange={(event) => setNewCompany({ ...newCompany, name: event.target.value })} placeholder="np. ABC Zarządzanie Nieruchomościami"/></label>
      <label>NIP firmy <span>— opcjonalnie</span><input value={newCompany.nip} onChange={(event) => setNewCompany({ ...newCompany, nip: event.target.value })} inputMode="numeric" placeholder="0000000000"/></label>
      <CompanyLogoPicker id="new-company-logo" value={newCompany.logo} onChange={(logo) => setNewCompany({ ...newCompany, logo })} onValidationError={(message) => setNotice(message ? { kind: "error", text: message } : null)} disabled={pending}/>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : <Plus size={16}/>}Dodaj firmę</button>
    </form>
    <div className="company-manager__list">{companies.map((company) => <Link key={company.id} className="community-card administrator-card company-manager__card-link" href={`/broker/administrators/${company.id}`}><span className="company-card-logo">{company.logoUrl ? <img src={company.logoUrl} alt={`Logo ${company.name}`}/> : <Building2 size={20}/>}</span><div><h3>{company.name}</h3><p><ClipboardList size={13}/>{company.communityCount} {communityWord(company.communityCount)} w obsłudze</p><small><UsersRound size={11}/>{company.accountCount} {company.accountCount === 1 ? "konto administratora" : "kont administratorów"}{company.nip ? ` · NIP ${company.nip}` : ""}</small></div></Link>)}</div>
  </section>;
}
