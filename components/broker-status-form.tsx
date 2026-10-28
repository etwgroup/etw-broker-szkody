"use client";

import { FormEvent, useState } from "react";
import { LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { ClaimStatus, statusMeta } from "@/lib/claims";
import { createClient } from "@/lib/supabase/client";

export function BrokerStatusForm({ claimId, status, insurerClaimNumber, paidAmount, demo = false }: { claimId: string; status: ClaimStatus; insurerClaimNumber?: string | null; paidAmount?: string | number | null; demo?: boolean }) {
  const router = useRouter(); const [nextStatus, setNextStatus] = useState<ClaimStatus>(status); const [number, setNumber] = useState(insurerClaimNumber || ""); const [payoutAmount, setPayoutAmount] = useState(paidAmount == null ? "" : String(paidAmount)); const [loading, setLoading] = useState(false); const [error, setError] = useState<string | null>(null); const [demoSaved, setDemoSaved] = useState(false);
  async function updateStatus(event: FormEvent) {
    event.preventDefault(); setLoading(true); setError(null);
    if (nextStatus === "insurer_claim_number_assigned" && !number.trim()) {
      setError("Podaj numer szkody nadany przez ubezpieczyciela."); setLoading(false); return;
    }
    const parsedPayout = Number(payoutAmount.replace(",", "."));
    if (nextStatus === "paid" && (!Number.isFinite(parsedPayout) || parsedPayout <= 0)) {
      setError("Przy statusie „Wypłacona” podaj kwotę wypłaty większą od zera."); setLoading(false); return;
    }
    if (demo) {
      window.setTimeout(() => { setDemoSaved(true); setLoading(false); }, 250);
      return;
    }
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesja wygasła.");
      const { error: updateError } = await supabase.from("claims").update({ status: nextStatus, insurer_claim_number: number.trim() || null, ...(nextStatus === "paid" ? { paid_amount: parsedPayout } : {}), updated_at: new Date().toISOString() }).eq("id", claimId);
      if (updateError) throw updateError;
      router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Nie udało się zmienić statusu."); }
    finally { setLoading(false); }
  }
  return <form className="status-form" onSubmit={updateStatus}><label className="kicker">Zmień status szkody</label><div className="form-row"><select aria-label="Status szkody" value={nextStatus} onChange={(event) => setNextStatus(event.target.value as ClaimStatus)}>{Object.entries(statusMeta).map(([value, meta]) => <option key={value} value={value}>{meta.label}</option>)}</select><button className="button button-primary" disabled={loading}>{loading ? <LoaderCircle className="spin" size={14}/> : "Zapisz"}</button></div>{nextStatus === "insurer_claim_number_assigned" && <label className="status-number-field"><span>Numer szkody ubezpieczyciela <b>*</b></span><input value={number} onChange={(event) => setNumber(event.target.value)} placeholder="np. PZU/2026/001234" required autoComplete="off" /></label>}{nextStatus === "paid" && <label className="status-number-field"><span>Kwota wypłaty brutto (PLN) <b>*</b></span><input value={payoutAmount} onChange={(event) => setPayoutAmount(event.target.value)} type="number" min="0.01" step="0.01" inputMode="decimal" placeholder="np. 12500,00" required /></label>}{demoSaved && <p className="demo-message">Status został zapisany w symulacji.</p>}{error && <p className="error-message">{error}</p>}</form>;
}
