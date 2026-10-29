"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { AlertCircle, CheckCircle2, FileText, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notice = { kind: "success" | "error"; text: string } | null;

export function PolicyUploadForm({ communityId, isDemo = false }: { communityId: string; isDemo?: boolean }) {
  const router = useRouter();
  const [file, setFile] = useState<File | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  const selectFile = (event: ChangeEvent<HTMLInputElement>) => {
    setFile(event.target.files?.[0] || null);
    setNotice(null);
  };

  const uploadPolicy = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formElement = event.currentTarget;
    setNotice(null);

    if (!file) {
      setNotice({ kind: "error", text: "Wybierz plik polisy w formacie PDF." });
      return;
    }
    if (file.type !== "application/pdf" && !file.name.toLowerCase().endsWith(".pdf")) {
      setNotice({ kind: "error", text: "Polisa musi być plikiem PDF." });
      return;
    }
    if (file.size > 20 * 1024 * 1024) {
      setNotice({ kind: "error", text: "Plik polisy nie może być większy niż 20 MB." });
      return;
    }

    const form = new FormData(formElement);
    const insurer = String(form.get("insurer") || "").trim();
    const policyNumber = String(form.get("policy_number") || "").trim();
    const validFrom = String(form.get("valid_from") || "");
    const validTo = String(form.get("valid_to") || "");
    if (!insurer || !policyNumber || !validFrom || !validTo) {
      setNotice({ kind: "error", text: "Uzupełnij ubezpieczyciela, numer oraz dokładny okres obowiązywania polisy." });
      return;
    }
    if (validTo < validFrom) {
      setNotice({ kind: "error", text: "Data końca ochrony nie może być wcześniejsza niż data początku." });
      return;
    }

    setPending(true);
    try {
      if (isDemo) {
        setNotice({ kind: "success", text: "Tryb demonstracyjny: formularz jest gotowy, ale dokument nie jest zapisywany trwale." });
        return;
      }

      const supabase = createClient();
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const storagePath = `${communityId}/${validTo.slice(0, 4)}/${crypto.randomUUID()}-${safeName}`;
      const { error: uploadError } = await supabase.storage.from("policy-documents").upload(storagePath, file, {
        contentType: "application/pdf",
        upsert: false,
      });
      if (uploadError) throw uploadError;

      const { error: policyError } = await supabase.from("insurance_policies").insert({
        community_id: communityId,
        insurer,
        policy_number: policyNumber,
        valid_from: validFrom,
        valid_to: validTo,
        file_name: file.name,
        storage_path: storagePath,
      });
      if (policyError) throw policyError;

      setFile(null);
      formElement.reset();
      setNotice({ kind: "success", text: "Polisa została dodana. Poprzednie dokumenty pozostają w archiwum." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się dodać polisy." });
    } finally {
      setPending(false);
    }
  };

  return <section className="policy-upload panel">
    <div className="policy-upload__heading">
      <span><UploadCloud size={19}/></span>
      <div><p className="kicker">Dokumentacja ubezpieczeniowa</p><h2>Dodaj aktualną polisę</h2><p>Dodany dokument będzie dostępny brokerowi oraz administratorowi tej wspólnoty.</p></div>
    </div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    <form className="policy-upload__form" onSubmit={uploadPolicy}>
      <label>Firma ubezpieczająca<input name="insurer" required placeholder="np. PZU S.A."/></label>
      <label>Numer polisy<input name="policy_number" required placeholder="np. PZU/WM/2026/001284"/></label>
      <label>Ochrona od<input name="valid_from" type="date" required/></label>
      <label>Ochrona do<input name="valid_to" type="date" required/></label>
      <label className="policy-upload__file"><span>Plik polisy (PDF, maks. 20 MB)</span><input name="file" type="file" accept="application/pdf,.pdf" required onChange={selectFile}/>{file ? <strong><FileText size={14}/>{file.name}</strong> : <em>Wybierz plik z dysku</em>}</label>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16}/> Dodawanie…</> : <><UploadCloud size={16}/> Dodaj polisę</>}</button>
    </form>
  </section>;
}
