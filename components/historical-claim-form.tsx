"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, ArchiveRestore, CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { statusMeta, type ClaimStatus } from "@/lib/claims";

type Community = { id: string; name: string; address: string };
type Notice = { kind: "success" | "error"; text: string } | null;

export function HistoricalClaimForm({ communities, demo = false }: { communities: Community[]; demo?: boolean }) {
  const router = useRouter();
  const [status, setStatus] = useState<ClaimStatus>("received");
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    setNotice(null);

    const payload = {
      communityId: String(form.get("community_id") || ""),
      title: String(form.get("title") || ""),
      description: String(form.get("description") || ""),
      occurredAt: String(form.get("occurred_at") || ""),
      reportedAt: String(form.get("reported_at") || ""),
      status,
      insurerClaimNumber: String(form.get("insurer_claim_number") || ""),
      paidAmount: String(form.get("paid_amount") || ""),
      paidAt: String(form.get("paid_at") || ""),
      reportedByName: String(form.get("reported_by_name") || ""),
      reportedByEmail: String(form.get("reported_by_email") || ""),
    };

    if (!payload.communityId || payload.title.trim().length < 3 || payload.description.trim().length < 10 || !payload.occurredAt || !payload.reportedAt) {
      setNotice({ kind: "error", text: "Uzupełnij wspólnotę, tytuł, opis oraz obie daty." });
      return;
    }
    if (status === "insurer_claim_number_assigned" && !payload.insurerClaimNumber.trim()) {
      setNotice({ kind: "error", text: "Podaj numer szkody nadany przez ubezpieczyciela." });
      return;
    }
    if (status === "paid" && !(Number(payload.paidAmount.replace(",", ".")) > 0)) {
      setNotice({ kind: "error", text: "Dla szkody wypłaconej podaj kwotę wypłaty większą od zera." });
      return;
    }

    setPending(true);
    try {
      if (demo) {
        setNotice({ kind: "success", text: "Tryb demonstracyjny: historyczna szkoda zostałaby dodana do wybranej wspólnoty." });
        return;
      }

      const response = await fetch("/api/broker/claims/historical", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const result = await response.json().catch(() => null) as { claim?: { id?: string }; error?: string } | null;
      if (!response.ok || !result?.claim?.id) throw new Error(result?.error || "Nie udało się dodać szkody historycznej.");

      router.push(`/broker/damages/${result.claim.id}`);
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się dodać szkody historycznej." });
    } finally {
      setPending(false);
    }
  };

  return <form className="form-panel panel form-stack" onSubmit={submit}>
    <div className="historical-claim-form__heading"><span><ArchiveRestore size={20}/></span><div><h2>Wprowadź wcześniej zgłoszoną szkodę</h2><p>Sprawa trafi do wybranej wspólnoty i będzie widoczna także dla jej administratora.</p></div></div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    <div className="form-grid">
      <div className="field full"><label htmlFor="historical-community">Wspólnota mieszkaniowa</label><select id="historical-community" name="community_id" required defaultValue=""><option value="" disabled>Wybierz wspólnotę, której dotyczy szkoda…</option>{communities.map((community) => <option key={community.id} value={community.id}>{community.name} — {community.address}</option>)}</select></div>
      <div className="field"><label htmlFor="historical-title">Tytuł szkody</label><input id="historical-title" name="title" required minLength={3} maxLength={140} placeholder="np. Uszkodzenie bramy wjazdowej"/></div>
      <div className="field"><label htmlFor="historical-occurred-at">Data zdarzenia</label><input id="historical-occurred-at" name="occurred_at" type="date" required/></div>
      <div className="field"><label htmlFor="historical-reported-at">Data zgłoszenia</label><input id="historical-reported-at" name="reported_at" type="date" required/></div>
      <div className="field"><label htmlFor="historical-status">Aktualny etap szkody</label><select id="historical-status" name="status" value={status} onChange={(event) => setStatus(event.target.value as ClaimStatus)}>{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select></div>
      {status === "insurer_claim_number_assigned" && <div className="field full"><label htmlFor="historical-insurer-number">Numer szkody nadany przez ubezpieczyciela</label><input id="historical-insurer-number" name="insurer_claim_number" required placeholder="np. 123456/2026"/></div>}
      {status === "paid" && <><div className="field"><label htmlFor="historical-paid-amount">Kwota wypłaty (PLN)</label><input id="historical-paid-amount" name="paid_amount" type="number" min="0.01" step="0.01" required placeholder="np. 12500,00"/></div><div className="field"><label htmlFor="historical-paid-at">Data wypłaty <span className="field-hint">(opcjonalnie)</span></label><input id="historical-paid-at" name="paid_at" type="date"/></div></>}
      <div className="field"><label htmlFor="historical-reporter">Osoba zgłaszająca <span className="field-hint">(opcjonalnie)</span></label><input id="historical-reporter" name="reported_by_name" placeholder="np. Anna Kowalska"/></div>
      <div className="field"><label htmlFor="historical-reporter-email">E-mail osoby zgłaszającej <span className="field-hint">(opcjonalnie)</span></label><input id="historical-reporter-email" name="reported_by_email" type="email" placeholder="anna@firma.pl"/></div>
      <div className="field full"><label htmlFor="historical-description">Opis szkody <span className="field-hint">(minimum 10 znaków)</span></label><textarea id="historical-description" name="description" required minLength={10} maxLength={5000} placeholder="Wprowadź posiadane informacje o zdarzeniu i dotychczasowym przebiegu sprawy."/></div>
    </div>
    <p className="historical-claim-form__note">Dodanie sprawy historycznej nie wysyła automatycznych e-maili ani powiadomień. Szkoda będzie dostępna w systemie dla brokera i administratorów przypisanych do tej wspólnoty.</p>
    <button className="button button-primary" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={16}/> Zapisywanie…</> : <><ArchiveRestore size={16}/> Dodaj zgłoszoną szkodę</>}</button>
  </form>;
}
