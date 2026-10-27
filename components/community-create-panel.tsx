"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, LoaderCircle, Plus, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseCommunityWorkbook, type ImportedCommunity } from "@/lib/community-import";
import { createClient } from "@/lib/supabase/client";

type Company = { id: string; name: string; nip?: string | null };
type CommunityCreatePanelProps = { companies: Company[]; isDemo?: boolean };
type Notice = { kind: "success" | "error"; text: string } | null;

const emptyManualForm = { companyId: "", name: "", address: "", nip: "", regon: "" };

function communityKey(community: Pick<ImportedCommunity, "name" | "address" | "nip">) {
  return community.nip || `${community.name}|${community.address}`.toLocaleLowerCase("pl-PL");
}

export function CommunityCreatePanel({ companies, isDemo = false }: CommunityCreatePanelProps) {
  const router = useRouter();
  const importInput = useRef<HTMLInputElement>(null);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [importedCommunities, setImportedCommunities] = useState<ImportedCommunity[]>([]);
  const [manualPending, setManualPending] = useState(false);
  const [importPending, setImportPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submitManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    if (!manualForm.companyId) {
      setNotice({ kind: "error", text: "Wybierz firmę administrującą, do której należy wspólnota." });
      return;
    }
    setManualPending(true);
    try {
      if (!isDemo) {
        const supabase = createClient();
        const { error } = await supabase.from("communities").insert({
          administrator_company_id: manualForm.companyId,
          name: manualForm.name.trim(),
          address: manualForm.address.trim(),
          nip: manualForm.nip.trim() || null,
          regon: manualForm.regon.trim() || null,
        });
        if (error) throw error;
      }
      setManualForm(emptyManualForm);
      setNotice({ kind: "success", text: isDemo ? "W trybie demonstracyjnym wspólnota nie jest zapisywana trwale." : "Wspólnota została dodana do firmy administrującej." });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się dodać wspólnoty." });
    } finally {
      setManualPending(false);
    }
  };

  const handleWorkbook = async (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setNotice(null);
    try {
      const parsed = parseCommunityWorkbook(await file.arrayBuffer());
      if (!parsed.length) throw new Error("Nie znaleziono poprawnych danych wspólnot w tym pliku.");
      setImportedCommunities(parsed);
      setNotice({ kind: "success", text: `Odczytano ${parsed.length} wspólnot z pliku. Po imporcie pozostaną nieprzypisane do firmy.` });
    } catch (error) {
      setImportedCommunities([]);
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się odczytać pliku Excel." });
    }
  };

  const importCommunities = async () => {
    if (!importedCommunities.length) return;
    setNotice(null);
    setImportPending(true);
    try {
      let insertedCount = importedCommunities.length;
      let updatedCount = 0;
      if (!isDemo) {
        const supabase = createClient();
        const { data, error } = await supabase.rpc("import_communities_from_register", {
          payload: importedCommunities.map(({ name, address, nip, regon }) => ({ name, address, nip, regon })),
        });
        if (error) throw error;
        const result = (data?.[0] || {}) as { inserted_count?: number; updated_count?: number };
        insertedCount = result.inserted_count || 0;
        updatedCount = result.updated_count || 0;
      }
      setImportedCommunities([]);
      setNotice({ kind: "success", text: isDemo ? `Tryb demonstracyjny: przygotowano odświeżenie danych ${insertedCount} wspólnot, ale dane nie są zapisywane trwale.` : `Dodano ${insertedCount} nowych wspólnot i zaktualizowano ${updatedCount} istniejących. Ręczne przypisania do firm pozostały bez zmian.` });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Import wspólnot nie powiódł się." });
    } finally {
      setImportPending(false);
    }
  };

  return <section className="community-create panel" aria-label="Dodawanie wspólnot">
    <div className="community-create__heading"><div><p className="kicker">Portfel brokera</p><h2>Dodaj wspólnoty</h2><p>Wspólnota należy do firmy administrującej, nie do pojedynczego konta użytkownika.</p></div></div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{notice.text}</p>}
    <div className="community-create__columns">
      <form className="community-add-form" onSubmit={submitManual}>
        <div className="community-add-form__title"><Plus size={18}/><div><h3>Dodaj ręcznie</h3><p>Przypisz pojedynczą wspólnotę do firmy.</p></div></div>
        <label>Firma administrująca<select required value={manualForm.companyId} onChange={(event) => setManualForm({ ...manualForm, companyId: event.target.value })}><option value="">Wybierz firmę administrującą</option>{companies.map((company) => <option key={company.id} value={company.id}>{company.name}</option>)}</select></label>
        <label>Nazwa wspólnoty<input required value={manualForm.name} onChange={(event) => setManualForm({ ...manualForm, name: event.target.value })} placeholder="np. Wspólnota Mieszkaniowa Parkowa 8" /></label>
        <label>Adres<input required value={manualForm.address} onChange={(event) => setManualForm({ ...manualForm, address: event.target.value })} placeholder="ul. Parkowa 8, 00-001 Warszawa" /></label>
        <label>NIP <span>— opcjonalnie</span><input value={manualForm.nip} onChange={(event) => setManualForm({ ...manualForm, nip: event.target.value })} inputMode="numeric" placeholder="0000000000" /></label>
        <label>REGON <span>— opcjonalnie</span><input value={manualForm.regon} onChange={(event) => setManualForm({ ...manualForm, regon: event.target.value })} inputMode="numeric" placeholder="000000000" /></label>
        <button className="button button-primary" type="submit" disabled={manualPending}>{manualPending ? <LoaderCircle className="spin" size={16}/> : <Plus size={16}/>}Dodaj wspólnotę</button>
      </form>
      <div className="community-import">
        <div className="community-add-form__title"><FileSpreadsheet size={19}/><div><h3>Import z pliku Excel</h3><p>Obsługiwany jest zbiorczy wykaz wspólnot na rok 2026.</p></div></div>
        <p className="community-import__explanation">Z pliku pobieramy nazwę, adres, NIP i REGON. Nowy import aktualizuje istniejące dane po NIP albo nazwie i adresie, zachowując ręczne przypisanie do firmy.</p>
        <input ref={importInput} className="visually-hidden" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleWorkbook}/>
        <button className="button button-ghost" type="button" onClick={() => importInput.current?.click()}><Upload size={16}/>Wybierz plik Excel</button>
        {importedCommunities.length > 0 && <div className="community-import__preview"><strong>Gotowe do odświeżenia: {importedCommunities.length}</strong><ul>{importedCommunities.slice(0, 3).map((community) => <li key={communityKey(community)}><b>{community.name}</b><span>{community.address}{community.nip ? ` · NIP ${community.nip}` : ""}{community.regon ? ` · REGON ${community.regon}` : ""}</span></li>)}</ul>{importedCommunities.length > 3 && <p className="community-import__more">…oraz {importedCommunities.length - 3} kolejnych wspólnot.</p>}<button className="button button-primary" type="button" onClick={importCommunities} disabled={importPending}>{importPending ? <LoaderCircle className="spin" size={16}/> : <Upload size={16}/>}Zaimportuj i odśwież dane</button></div>}
      </div>
    </div>
  </section>;
}
