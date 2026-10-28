"use client";

import { ChangeEvent, FormEvent, useEffect, useMemo, useState } from "react";
import { AlertCircle, CheckCircle2, Download, FileText, LoaderCircle, MessageCircleMore, Paperclip, SendHorizonal, ShieldAlert, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { formatDateTime } from "@/lib/claims";
import { createClient } from "@/lib/supabase/client";
import type { ClaimMessage } from "@/lib/claim-conversation";

type Role = "administrator" | "broker";
type Notice = { kind: "success" | "error"; text: string } | null;

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function formError(reason: unknown) {
  if (reason && typeof reason === "object" && "message" in reason && typeof reason.message === "string") return reason.message;
  return "Nie udało się wysłać odpowiedzi.";
}

export function ClaimConversation({ claimId, role, messages, demo = false }: { claimId: string; role: Role; messages: ClaimMessage[]; demo?: boolean }) {
  const router = useRouter();
  const [displayMessages, setDisplayMessages] = useState(messages);
  const [body, setBody] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [requiresAction, setRequiresAction] = useState(role === "broker");
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);
  const requiresAdministratorAction = useMemo(() => role === "administrator" && displayMessages.some((message) => message.sender_role === "broker" && message.requires_action), [displayMessages, role]);

  useEffect(() => setDisplayMessages(messages), [messages]);

  const addFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(event.target.files || []);
    setFiles((current) => {
      const existing = new Set(current.map(fileKey));
      return [...current, ...selected.filter((file) => !existing.has(fileKey(file)))];
    });
    event.currentTarget.value = "";
  };

  const removeFile = (file: File) => setFiles((current) => current.filter((item) => fileKey(item) !== fileKey(file)));

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const messageBody = body.trim();
    const tooLargeFile = files.find((file) => file.size > 20 * 1024 * 1024);
    setNotice(null);

    if (!messageBody && !files.length) {
      setNotice({ kind: "error", text: "Wpisz odpowiedź lub dodaj przynajmniej jeden plik." });
      return;
    }
    if (messageBody.length > 2000) {
      setNotice({ kind: "error", text: "Odpowiedź może mieć maksymalnie 2000 znaków." });
      return;
    }
    if (tooLargeFile) {
      setNotice({ kind: "error", text: `Plik „${tooLargeFile.name}” jest większy niż 20 MB.` });
      return;
    }

    setPending(true);
    try {
      if (demo) {
        setDisplayMessages((current) => [...current, {
          id: `demo-message-${Date.now()}`,
          claim_id: claimId,
          sender_id: `demo-${role}`,
          sender_role: role,
          sender_name: role === "broker" ? "Marta Broker" : "Anna Administrator",
          body: messageBody,
          requires_action: role === "broker" ? requiresAction : false,
          created_at: new Date().toISOString(),
          attachments: files.map((file, index) => ({ id: `demo-attachment-${Date.now()}-${index}`, message_id: "", file_name: file.name, mime_type: file.type, size_bytes: file.size })),
        }]);
        setBody("");
        setFiles([]);
        setNotice({ kind: "success", text: "Odpowiedź została dodana w trybie demonstracyjnym." });
        return;
      }

      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");

      const { data: message, error: messageError } = await supabase
        .from("claim_messages")
        .insert({ claim_id: claimId, sender_id: user.id, body: messageBody, requires_action: role === "broker" ? requiresAction : false })
        .select("id")
        .single();
      if (messageError || !message) throw messageError || new Error("Nie udało się zapisać odpowiedzi.");

      const failed: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${claimId}/${message.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("claim-message-attachments").upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) { failed.push(file.name); continue; }
        const { error: attachmentError } = await supabase.from("claim_message_attachments").insert({
          message_id: message.id,
          file_name: file.name,
          storage_path: storagePath,
          mime_type: file.type,
          size_bytes: file.size,
          uploaded_by: user.id,
        });
        if (attachmentError) failed.push(file.name);
      }

      setBody("");
      setFiles([]);
      setNotice({ kind: failed.length ? "error" : "success", text: failed.length ? "Odpowiedź została wysłana, ale niektóre pliki nie zostały dodane." : "Odpowiedź została wysłana." });
      router.refresh();
    } catch (reason) {
      setNotice({ kind: "error", text: formError(reason) });
    } finally {
      setPending(false);
    }
  };

  return <section className="claim-conversation panel">
    <header className="claim-conversation__header">
      <div><p className="kicker">Komunikacja w sprawie</p><h2><MessageCircleMore size={18}/> Historia odpowiedzi</h2></div>
      <span>{displayMessages.length === 1 ? "1 wiadomość" : `${displayMessages.length} wiadomości`}</span>
    </header>

    {requiresAdministratorAction && <div className="claim-conversation__action-alert"><ShieldAlert size={20}/><div><strong>Odpowiedź brokera wymaga Twojego działania</strong><p>Zapoznaj się z wiadomością i prześlij odpowiedź lub wymagane dokumenty.</p></div></div>}

    <div className="claim-conversation__thread">
      {displayMessages.length ? displayMessages.map((message) => <article className={`claim-message claim-message--${message.sender_role}`} key={message.id}>
        <div className="claim-message__meta"><strong>{message.sender_name || (message.sender_role === "broker" ? "Broker ETW" : "Administrator")}</strong><span>{message.sender_role === "broker" ? "Broker ubezpieczeniowy" : "Administrator wspólnoty"} · {formatDateTime(message.created_at)}</span></div>
        {message.requires_action && message.sender_role === "broker" && <p className="claim-message__action"><ShieldAlert size={14}/> Wymaga działania administratora</p>}
        {message.body && <p className="claim-message__body">{message.body}</p>}
        {message.attachments.length > 0 && <div className="claim-message__files">{message.attachments.map((attachment) => attachment.url ? <a key={attachment.id} href={attachment.url} target="_blank" rel="noreferrer"><FileText size={14}/><span>{attachment.file_name}</span><Download size={13}/></a> : <span key={attachment.id}><FileText size={14}/>{attachment.file_name}</span>)}</div>}
      </article>) : <div className="claim-conversation__empty"><MessageCircleMore size={23}/><p>Brak odpowiedzi. Możesz rozpocząć komunikację w tej sprawie.</p></div>}
    </div>

    <form className="claim-conversation__composer" onSubmit={submit}>
      <label htmlFor={`reply-${claimId}`}>{role === "broker" ? "Odpowiedź dla administratora" : "Odpowiedź dla brokera"}</label>
      <textarea id={`reply-${claimId}`} value={body} onChange={(event) => setBody(event.target.value)} maxLength={2000} placeholder={role === "broker" ? "Opisz kolejne kroki lub potrzebne informacje…" : "Przekaż odpowiedź albo dodatkowe informacje…"}/>
      <div className="claim-conversation__tools">
        <label className="claim-conversation__file"><Paperclip size={15}/><span>Dodaj dokument</span><input type="file" multiple accept="image/*,.pdf,.xlsx,.xls,.doc,.docx" onChange={addFiles}/></label>
        {role === "broker" && <label className="claim-conversation__switch"><input type="checkbox" checked={requiresAction} onChange={(event) => setRequiresAction(event.target.checked)}/> Wymaga działania administratora</label>}
        <button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : <SendHorizonal size={16}/>} Wyślij odpowiedź</button>
      </div>
      {files.length > 0 && <div className="claim-conversation__selected-files">{files.map((file) => <span key={fileKey(file)}><FileText size={13}/>{file.name}<button type="button" aria-label={`Usuń plik ${file.name}`} onClick={() => removeFile(file)}><X size={13}/></button></span>)}</div>}
      {notice && <p className={`claim-conversation__notice claim-conversation__notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={15}/> : <AlertCircle size={15}/>} {notice.text}</p>}
    </form>
  </section>;
}
