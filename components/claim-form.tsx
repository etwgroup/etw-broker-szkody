"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { FileText, LoaderCircle, UploadCloud, X } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Community = { id: string; name: string; address: string };

function fileKey(file: File) {
  return `${file.name}-${file.size}-${file.lastModified}`;
}

function submissionError(reason: unknown) {
  if (!reason || typeof reason !== "object") return "Nie udało się wysłać zgłoszenia.";
  const error = reason as { message?: unknown; code?: unknown };
  const message = typeof error.message === "string" ? error.message : "";
  const code = typeof error.code === "string" ? error.code : "";

  if (message.includes("claims_description") || message.includes("description_check")) return "Opis szkody powinien zawierać od 10 do 5000 znaków.";
  if (message.includes("claims_title") || message.includes("title_check")) return "Tytuł szkody powinien zawierać od 3 do 140 znaków.";
  if (code === "42501" || message.toLowerCase().includes("row-level security")) return "Nie masz dostępu do zgłaszania szkody dla tej wspólnoty. Skontaktuj się z brokerem.";
  if (message) return `Nie udało się wysłać zgłoszenia: ${message}`;
  return "Nie udało się wysłać zgłoszenia.";
}

export function ClaimForm({ communities, demo = false }: { communities: Community[]; demo?: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles((current) => {
      const present = new Set(current.map(fileKey));
      return [...current, ...selectedFiles.filter((file) => !present.has(fileKey(file)))];
    });
    event.currentTarget.value = "";
  };

  const removeFile = (file: File) => setFiles((current) => current.filter((item) => fileKey(item) !== fileKey(file)));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    const form = new FormData(event.currentTarget);
    const title = String(form.get("title") || "").trim();
    const description = String(form.get("description") || "").trim();
    const tooLargeFile = files.find((file) => file.size > 20 * 1024 * 1024);

    if (title.length < 3) {
      setError("Tytuł szkody powinien zawierać co najmniej 3 znaki.");
      return;
    }
    if (description.length < 10) {
      setError("Opis szkody powinien zawierać co najmniej 10 znaków.");
      return;
    }
    if (tooLargeFile) {
      setError(`Plik „${tooLargeFile.name}” jest większy niż 20 MB.`);
      return;
    }
    if (!files.length && !window.confirm("Czy na pewno chcesz wysłać zgłoszenie bez załączników?")) {
      return;
    }

    setLoading(true);
    if (demo) {
      window.setTimeout(() => { router.push("/admin/damages/demo-claim-1?submitted=1"); router.refresh(); }, 350);
      return;
    }
    try {
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Sesja wygasła. Zaloguj się ponownie.");
      const { data: claim, error: claimError } = await supabase.from("claims").insert({
        community_id: String(form.get("community_id")),
        created_by: user.id,
        title,
        description,
        occurred_at: String(form.get("occurred_at")),
      }).select("id").single();
      if (claimError || !claim) throw claimError || new Error("Nie udało się utworzyć zgłoszenia.");

      const failed: string[] = [];
      for (const file of files) {
        const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
        const storagePath = `${claim.id}/${crypto.randomUUID()}-${safeName}`;
        const { error: uploadError } = await supabase.storage.from("claim-attachments").upload(storagePath, file, { contentType: file.type, upsert: false });
        if (uploadError) { failed.push(file.name); continue; }
        const { error: attachmentError } = await supabase.from("claim_attachments").insert({ claim_id: claim.id, file_name: file.name, storage_path: storagePath, mime_type: file.type, size_bytes: file.size, uploaded_by: user.id });
        if (attachmentError) failed.push(file.name);
      }
      router.push(`/admin/damages/${claim.id}${failed.length ? "?attachments=partial" : ""}`);
      router.refresh();
    } catch (reason) {
      setError(submissionError(reason));
    } finally {
      setLoading(false);
    }
  }

  return <form className="form-panel panel form-stack" onSubmit={handleSubmit}>
    <h2>Dane zdarzenia</h2>
    <div className="form-grid">
      <div className="field full"><label htmlFor="community_id">Wspólnota mieszkaniowa</label><select id="community_id" name="community_id" required defaultValue=""><option value="" disabled>Wybierz wspólnotę…</option>{communities.map((community) => <option key={community.id} value={community.id}>{community.name} — {community.address}</option>)}</select></div>
      <div className="field"><label htmlFor="title">Tytuł szkody</label><input id="title" name="title" placeholder="np. Zalanie pionu w lokalu 14" required minLength={3} maxLength={140}/></div>
      <div className="field"><label htmlFor="occurred_at">Data zdarzenia</label><input id="occurred_at" name="occurred_at" type="date" required/></div>
      <div className="field full"><label htmlFor="description">Opis szkody <span className="field-hint">(minimum 10 znaków)</span></label><textarea id="description" name="description" placeholder="Opisz co się wydarzyło, jakie są widoczne uszkodzenia i jakie działania zostały już podjęte." required minLength={10} maxLength={5000}/></div>
      <div className="field full"><label>Załączniki</label><div className="attachment-zone"><input aria-label="Dodaj załączniki" type="file" multiple accept="image/*,.pdf,.xlsx,.xls,.doc,.docx" onChange={onFiles}/><div><UploadCloud size={24}/><strong>{files.length ? "Dodaj kolejne pliki" : "Upuść pliki tutaj lub wybierz z dysku"}</strong><span>Zdjęcia, faktury, kosztorysy · maks. 20 MB na plik</span></div></div>{files.length > 0 && <div className="file-list">{files.map((file) => <div className="file-item" key={fileKey(file)}><FileText size={13}/><span>{file.name} ({Math.ceil(file.size / 1024)} KB)</span><button type="button" onClick={() => removeFile(file)} aria-label={`Usuń plik ${file.name}`} title="Usuń plik"><X size={14}/></button></div>)}</div>}</div>
    </div>
    {error && <p className="error-message" role="alert">{error}</p>}
    <button className="button button-primary" type="submit" disabled={loading}>{loading ? <><LoaderCircle size={16} className="spin"/> Wysyłanie…</> : "Wyślij zgłoszenie"}</button>
  </form>;
}
