"use client";

import { FormEvent, useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, FileLock2, LoaderCircle, SendHorizontal } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/claims";
import { createClient } from "@/lib/supabase/client";
import type { ClaimInternalNote } from "@/lib/claim-internal-notes";

type Notice = { kind: "success" | "error"; text: string } | null;

export function BrokerInternalNotes({ claimId, notes, demo = false }: { claimId: string; notes: ClaimInternalNote[]; demo?: boolean }) {
  const router = useRouter();
  const [items, setItems] = useState(notes);
  const [body, setBody] = useState("");
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  useEffect(() => setItems(notes), [notes]);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const text = body.trim();
    setNotice(null);
    if (!text) { setNotice({ kind: "error", text: "Wpisz treść notatki." }); return; }
    if (text.length > 4000) { setNotice({ kind: "error", text: "Notatka może mieć maksymalnie 4000 znaków." }); return; }
    setPending(true);
    try {
      if (demo) {
        setItems((current) => [{ id: `demo-note-${Date.now()}`, claim_id: claimId, author_name: "Jessica Klimiuk-Waszczuk", body: text, created_at: new Date().toISOString() }, ...current]);
        setBody(""); setNotice({ kind: "success", text: "Notatka została dodana w trybie demonstracyjnym." }); return;
      }
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      const { error } = await supabase.from("claim_internal_notes").insert({ claim_id: claimId, created_by: user.id, body: text });
      if (error) throw error;
      setBody(""); setNotice({ kind: "success", text: "Notatka wewnętrzna została zapisana." }); router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać notatki." });
    } finally { setPending(false); }
  };

  return <section className="broker-notes panel"><header><div><p className="kicker">Tylko dla brokera</p><h2><FileLock2 size={18}/> Notatki wewnętrzne</h2></div><span>Niewidoczne dla administratora</span></header><form onSubmit={submit}><textarea value={body} onChange={(event) => setBody(event.target.value)} maxLength={4000} placeholder="Dodaj ustalenie wewnętrzne, termin lub informację dla zespołu…"/><button className="button button-secondary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : <SendHorizontal size={16}/>} Dodaj notatkę</button></form>{notice && <p className={`broker-notes__notice broker-notes__notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>} {notice.text}</p>}<div className="broker-notes__list">{items.length ? items.map((note) => <article key={note.id}><strong>{note.author_name || "Broker ETW"}</strong><span>{formatDateTime(note.created_at)}</span><p>{note.body}</p></article>) : <p className="broker-notes__empty">Brak notatek wewnętrznych dla tej szkody.</p>}</div></section>;
}
