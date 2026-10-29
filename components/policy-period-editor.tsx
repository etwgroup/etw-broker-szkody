"use client";

import { FormEvent, useState } from "react";
import { AlertCircle, CalendarClock, CheckCircle2, LoaderCircle, PencilLine, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Notice = { kind: "success" | "error"; text: string } | null;

export function PolicyPeriodEditor({
  policyId,
  validFrom,
  validTo,
  isDemo = false,
  compact = false,
}: {
  policyId: string;
  validFrom: string;
  validTo: string;
  isDemo?: boolean;
  compact?: boolean;
}) {
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  const savePeriod = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    const newValidFrom = String(form.get("valid_from") || "");
    const newValidTo = String(form.get("valid_to") || "");
    setNotice(null);

    if (!newValidFrom || !newValidTo) {
      setNotice({ kind: "error", text: "Podaj datę początku i końca ochrony." });
      return;
    }
    if (newValidTo < newValidFrom) {
      setNotice({ kind: "error", text: "Data końca ochrony nie może być wcześniejsza niż data początku." });
      return;
    }

    setPending(true);
    try {
      if (isDemo) {
        setNotice({ kind: "success", text: "Tryb demonstracyjny: okres zostałby zaktualizowany." });
        return;
      }

      const supabase = createClient();
      const { error } = await supabase
        .from("insurance_policies")
        .update({ valid_from: newValidFrom, valid_to: newValidTo })
        .eq("id", policyId);
      if (error) throw error;

      setIsEditing(false);
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać okresu ochrony." });
    } finally {
      setPending(false);
    }
  };

  if (!isEditing) {
    return <button className="button button-ghost policy-period-editor__trigger" type="button" onClick={() => { setNotice(null); setIsEditing(true); }}><PencilLine size={15}/> Edytuj okres</button>;
  }

  return <div className={`policy-period-editor${compact ? " policy-period-editor--compact" : ""}`}>
    <form onSubmit={savePeriod}>
      <label>Ochrona od<input name="valid_from" type="date" defaultValue={validFrom} required/></label>
      <label>Ochrona do<input name="valid_to" type="date" defaultValue={validTo} required/></label>
      <div className="policy-period-editor__actions">
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? <><LoaderCircle className="spin" size={14}/> Zapisywanie…</> : <><CalendarClock size={14}/> Zapisz okres</>}</button>
        <button className="button button-ghost" type="button" disabled={pending} onClick={() => { setNotice(null); setIsEditing(false); }}><X size={14}/> Anuluj</button>
      </div>
    </form>
    {notice && <p className={`policy-period-editor__notice policy-period-editor__notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={14}/> : <AlertCircle size={14}/>} {notice.text}</p>}
  </div>;
}
