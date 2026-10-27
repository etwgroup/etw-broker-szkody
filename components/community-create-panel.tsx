"use client";

import { AlertCircle, CheckCircle2, FileSpreadsheet, LoaderCircle, Plus, Upload } from "lucide-react";
import { ChangeEvent, FormEvent, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { parseCommunityWorkbook, type ImportedCommunity } from "@/lib/community-import";
import { createClient } from "@/lib/supabase/client";

type Administrator = { id: string; full_name: string | null };

type CommunityCreatePanelProps = {
  administrators: Administrator[];
  isDemo?: boolean;
};

type Notice = { kind: "success" | "error"; text: string } | null;

const emptyManualForm = { administratorId: "", name: "", address: "", nip: "" };

function communityKey(community: Pick<ImportedCommunity, "name" | "address" | "nip">) {
  return community.nip || `${community.name}|${community.address}`.toLocaleLowerCase("pl-PL");
}

export function CommunityCreatePanel({ administrators, isDemo = false }: CommunityCreatePanelProps) {
  const router = useRouter();
  const importInput = useRef<HTMLInputElement>(null);
  const [manualForm, setManualForm] = useState(emptyManualForm);
  const [importAdministratorId, setImportAdministratorId] = useState("");
  const [importedCommunities, setImportedCommunities] = useState<ImportedCommunity[]>([]);
  const [manualPending, setManualPending] = useState(false);
  const [importPending, setImportPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submitManual = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    if (!manualForm.administratorId) {
      setNotice({ kind: "error", text: "Wybierz konto administratora, do którego ma należeć wspólnota." });
      return;
    }

    setManualPending(true);
    try {
      if (!isDemo) {
        const supabase = createClient();
        const { error } = await supabase.from("communities").insert({
          administrator_id: manualForm.administratorId,
          name: manualForm.name.trim(),
          address: manualForm.address.trim(),
          nip: manualForm.nip.trim() || null,
        });
        if (error) throw error;
      }
      setManualForm(emptyManualForm);
      setNotice({ kind: "success", text: isDemo ? "W trybie demonstracyjnym wspólnota nie jest zapisywana trwale." : "Wspólnota została dodana do konta administratora." });
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
      setNotice({ kind: "success", text: `Odczytano ${parsed.length} wspólnot z pliku. Wybierz konto administratora i zatwierdź import.` });
    } catch (error) {
      setImportedCommunities([]);
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się odczytać pliku Excel." });
    }
  };

  const importCommunities = async () => {
    setNotice(null);
    if (!importAdministratorId) {
      setNotice({ kind: "error", text: "Wybierz konto administratora, do którego mają zostać przypisane wspólnoty z pliku." });
      return;
    }
    if (!importedCommunities.length) return;

    setImportPending(true);
    try {
      let communitiesToInsert = importedCommunities;
      if (!isDemo) {
        const supabase = createClient();
        const { data: existing, error: existingError } = await supabase
          .from("communities")
          .select("name, address, nip")
          .eq("administrator_id", importAdministratorId);
        if (existingError) throw existingError;

        const existingKeys = new Set((existing || []).map((community) => communityKey(community)));
        communitiesToInsert = importedCommunities.filter((community) => !existingKeys.has(communityKey(community)));

        for (let index = 0; index < communitiesToInsert.length; index += 100) {
          const batch = communitiesToInsert.slice(index, index + 100).map((community) => ({
            administrator_id: importAdministratorId,
            name: community.name,
            address: community.address,
            nip: community.nip,
          }));
          if (!batch.length) continue;
          const { error } = await supabase.from("communities").insert(batch);
          if (error) throw error;
        }
      }
      const skipped = importedCommunities.length - communitiesToInsert.length;
      setImportedCommunities([]);
      setImportAdministratorId("");
      setNotice({ kind: "success", text: isDemo ? `Tryb demonstracyjny: przygotowano import ${communitiesToInsert.length} wspólnot, ale dane nie są zapisywane trwale.` : `Dodano ${communitiesToInsert.length} wspólnot.${skipped ? ` Pominięto ${skipped} już istniejących.` : ""}` });
      router.refresh();
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Import wspólnot nie powiódł się." });
    } finally {
      setImportPending(false);
    }
  };

  return <section className="community-create panel" aria-label="Dodawanie wspólnot">
    <div className="community-create__heading">
      <div>
        <p className="kicker">Portfel brokera</p>
        <h2>Dodaj wspólnoty</h2>
        <p>Dodaj pojedynczą wspólnotę lub wczytaj zbiorczy wykaz w formacie Excel.</p>
      </div>
    </div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16} /> : <AlertCircle size={16} />}{notice.text}</p>}
    {!administrators.length ? <div className="community-create__empty"><AlertCircle size={19}/><p>Najpierw utwórz konto administratora. Dopiero wtedy można przypisać do niego wspólnoty.</p></div> : <div className="community-create__columns">
      <form className="community-add-form" onSubmit={submitManual}>
        <div className="community-add-form__title"><Plus size={18}/><div><h3>Dodaj ręcznie</h3><p>Utwórz pojedynczą wspólnotę.</p></div></div>
        <label>Administrator w portalu<select required value={manualForm.administratorId} onChange={(event) => setManualForm({ ...manualForm, administratorId: event.target.value })}><option value="">Wybierz konto administratora</option>{administrators.map((administrator) => <option key={administrator.id} value={administrator.id}>{administrator.full_name || "Administrator bez nazwy"}</option>)}</select></label>
        <label>Nazwa wspólnoty<input required value={manualForm.name} onChange={(event) => setManualForm({ ...manualForm, name: event.target.value })} placeholder="np. Wspólnota Mieszkaniowa Parkowa 8" /></label>
        <label>Adres<input required value={manualForm.address} onChange={(event) => setManualForm({ ...manualForm, address: event.target.value })} placeholder="ul. Parkowa 8, 00-001 Warszawa" /></label>
        <label>NIP <span>— opcjonalnie</span><input value={manualForm.nip} onChange={(event) => setManualForm({ ...manualForm, nip: event.target.value })} inputMode="numeric" placeholder="0000000000" /></label>
        <button className="button button-primary" type="submit" disabled={manualPending}>{manualPending ? <LoaderCircle className="spin" size={16}/> : <Plus size={16}/>}Dodaj wspólnotę</button>
      </form>
      <div className="community-import">
        <div className="community-add-form__title"><FileSpreadsheet size={19}/><div><h3>Import z pliku Excel</h3><p>Obsługiwany jest zbiorczy wykaz wspólnot na rok 2026.</p></div></div>
        <p className="community-import__explanation">Z pliku pobieramy: nazwę, adres, NIP i administratora wskazanego w wykazie. Przed importem wybierasz konto administratora w portalu.</p>
        <input ref={importInput} className="visually-hidden" type="file" accept=".xlsx,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" onChange={handleWorkbook}/>
        <button className="button button-ghost" type="button" onClick={() => importInput.current?.click()}><Upload size={16}/>Wybierz plik Excel</button>
        {importedCommunities.length > 0 && <div className="community-import__preview">
          <strong>Gotowe do importu: {importedCommunities.length}</strong>
          <label>Przypisz wszystkie do konta administratora<select value={importAdministratorId} onChange={(event) => setImportAdministratorId(event.target.value)}><option value="">Wybierz konto administratora</option>{administrators.map((administrator) => <option key={administrator.id} value={administrator.id}>{administrator.full_name || "Administrator bez nazwy"}</option>)}</select></label>
          <ul>{importedCommunities.slice(0, 3).map((community) => <li key={communityKey(community)}><b>{community.name}</b><span>{community.address}{community.sourceAdministrator ? ` · wykaz: ${community.sourceAdministrator}` : ""}</span></li>)}</ul>
          {importedCommunities.length > 3 && <p className="community-import__more">…oraz {importedCommunities.length - 3} kolejnych wspólnot.</p>}
          <button className="button button-primary" type="button" onClick={importCommunities} disabled={importPending}>{importPending ? <LoaderCircle className="spin" size={16}/> : <Upload size={16}/>}Zaimportuj wspólnoty</button>
        </div>}
      </div>
    </div>}
  </section>;
}
