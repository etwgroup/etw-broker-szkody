"use client";

import { AlertTriangle, LoaderCircle, Trash2, X } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type DeletionTarget = {
  kind: "account" | "community" | "company";
  id: string;
  name: string;
};

export function BrokerDeleteConfirmation({ target, isDemo = false }: { target: DeletionTarget; isDemo?: boolean }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [password, setPassword] = useState("");
  const [pending, setPending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const isCommunity = target.kind === "community";
  const isCompany = target.kind === "company";
  const noun = isCommunity ? "wspólnotę" : isCompany ? "firmę administrującą" : "konto administratora";
  const triggerLabel = isCommunity ? "Usuń wspólnotę" : isCompany ? "Usuń firmę" : "Usuń konto";
  const warning = isCommunity
    ? "Usunięte zostaną również przypisane szkody, wiadomości, polisy i pliki."
    : isCompany
      ? "Konta administratorów i wspólnoty pozostaną w systemie, ale nie będą już przypisane do tej firmy."
      : "Konto oraz dostęp do panelu zostaną usunięte. Historia szkód pozostanie w dokumentacji sprawy.";

  const close = () => {
    if (pending) return;
    setOpen(false);
    setPassword("");
    setError(null);
  };

  const remove = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setPending(true);
    setError(null);
    try {
      if (isDemo) throw new Error("Tryb demonstracyjny nie pozwala na trwałe usuwanie danych.");
      const response = await fetch("/api/broker/secure-delete", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ target: target.kind, id: target.id, password }),
      });
      const result = await response.json().catch(() => ({}));
      if (!response.ok) throw new Error(result.error || `Nie udało się usunąć ${noun}.`);
      if (isCommunity) {
        setOpen(false);
        router.replace("/broker/communities");
      } else if (isCompany) {
        setOpen(false);
        router.replace("/broker/administrators");
      } else {
        setOpen(false);
        router.refresh();
      }
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : `Nie udało się usunąć ${noun}.`);
    } finally {
      setPending(false);
    }
  };

  return <>
    <button className="button button-danger" type="button" onClick={() => setOpen(true)}><Trash2 size={15}/> {triggerLabel}</button>
    {open && <div className="broker-delete-dialog" role="presentation">
      <div className="broker-delete-dialog__backdrop" onClick={close}/>
      <section className="broker-delete-dialog__card" role="dialog" aria-modal="true" aria-labelledby={`delete-title-${target.id}`}>
        <button className="broker-delete-dialog__close" type="button" onClick={close} aria-label="Zamknij"><X size={18}/></button>
        <span className="broker-delete-dialog__icon"><AlertTriangle size={22}/></span>
        <p className="kicker">Operacja nieodwracalna</p>
        <h2 id={`delete-title-${target.id}`}>Usuń {noun}</h2>
        <p>Potwierdź usunięcie: <strong>{target.name}</strong>.</p>
        <p className="broker-delete-dialog__warning">{warning}</p>
        <form onSubmit={remove}>
          <label htmlFor={`broker-password-${target.id}`}>Wpisz swoje aktualne hasło brokera</label>
          <input id={`broker-password-${target.id}`} type="password" value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="current-password" required autoFocus/>
          {error && <p className="broker-delete-dialog__error" role="alert">{error}</p>}
          <div className="broker-delete-dialog__actions">
            <button className="button button-ghost" type="button" onClick={close} disabled={pending}>Anuluj</button>
            <button className="button button-danger" type="submit" disabled={pending || !password}>{pending ? <LoaderCircle className="spin" size={16}/> : <Trash2 size={16}/>} Usuń trwale</button>
          </div>
        </form>
      </section>
    </div>}
  </>;
}

