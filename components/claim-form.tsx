"use client";

import { ChangeEvent, FormEvent, useState } from "react";
import { FileText, LoaderCircle, UploadCloud } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

type Community = { id: string; name: string; address: string };

export function ClaimForm({ communities, demo = false }: { communities: Community[]; demo?: boolean }) {
  const router = useRouter();
  const [files, setFiles] = useState<File[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const onFiles = (event: ChangeEvent<HTMLInputElement>) => setFiles(Array.from(event.target.files || []));

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setLoading(true);
    const form = new FormData(event.currentTarget);
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
        title: String(form.get("title")),
        description: String(form.get("description")),
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
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Nie udało się wysłać zgłoszenia."); }
    finally { setLoading(false); }
  }

  return <form className="form-panel panel form-stack" onSubmit={handleSubmit}>
    <h2>Dane zdarzenia</h2>
    <div className="form-grid">
      <div className="field full"><label htmlFor="community_id">Wspólnota mieszkaniowa</label><select id="community_id" name="community_id" required defaultValue=""><option value="" disabled>Wybierz wspólnotę…</option>{communities.map((community) => <option key={community.id} value={community.id}>{community.name} — {community.address}</option>)}</select></div>
      <div className="field"><label htmlFor="title">Tytuł szkody</label><input id="title" name="title" placeholder="np. Zalanie pionu w lokalu 14" required maxLength={140}/></div>
      <div className="field"><label htmlFor="occurred_at">Data zdarzenia</label><input id="occurred_at" name="occurred_at" type="date" required/></div>
      <div className="field full"><label htmlFor="description">Opis szkody</label><textarea id="description" name="description" placeholder="Opisz co się wydarzyło, jakie są widoczne uszkodzenia i jakie działania zostały już podjęte." required maxLength={5000}/></div>
      <div className="field full"><label>Załączniki</label><div className="attachment-zone"><input aria-label="Dodaj załączniki" type="file" multiple accept="image/*,.pdf,.xlsx,.xls,.doc,.docx" onChange={onFiles}/><div><UploadCloud size={24}/><strong>Upuść pliki tutaj lub wybierz z dysku</strong><span>Zdjęcia, faktury, kosztorysy · maks. 20 MB na plik</span></div></div>{files.length > 0 && <div className="file-list">{files.map((file) => <div className="file-item" key={`${file.name}-${file.lastModified}`}><FileText size={13}/>{file.name} <span>({Math.ceil(file.size / 1024)} KB)</span></div>)}</div>}</div>
    </div>
    {error && <p className="error-message">{error}</p>}
    <button className="button button-primary" type="submit" disabled={loading}>{loading ? <><LoaderCircle size={16} className="spin"/> Wysyłanie…</> : "Wyślij zgłoszenie"}</button>
  </form>;
}
