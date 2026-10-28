"use client";

import { AlertCircle, BadgeCheck, CheckCircle2, Clock3, LoaderCircle, MailCheck, Pencil, UsersRound } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Company = { id: string; name: string };
type Account = { id: string; full_name: string | null; email: string | null; administrator_company_id: string | null; account_activated_at: string | null };
type Notice = { kind: "success" | "error"; text: string } | null;
type EditingAccount = { id: string; fullName: string; email: string; companyId: string };

export function AdministratorAccountDirectory({ accounts, companies, isDemo = false }: { accounts: Account[]; companies: Company[]; isDemo?: boolean }) {
  const router = useRouter();
  const [editing, setEditing] = useState<EditingAccount | null>(null);
  const [notice, setNotice] = useState<Notice>(null);
  const [pending, setPending] = useState(false);

  const startEditing = (account: Account) => setEditing({ id: account.id, fullName: account.full_name || "", email: account.email || "", companyId: account.administrator_company_id || "" });
  const save = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!editing) return;
    setPending(true);
    setNotice(null);
    try {
      if (isDemo) {
        setNotice({ kind: "success", text: "Tryb demonstracyjny: dane nie są zapisywane trwale." });
      } else {
        const response = await fetch("/api/broker/administrator-accounts", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ accountId: editing.id, fullName: editing.fullName, email: editing.email, companyId: editing.companyId }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Nie udało się zapisać konta administratora.");
        setNotice({ kind: "success", text: "Dane konta administratora zostały zapisane." });
        setEditing(null);
        router.refresh();
      }
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się zapisać konta administratora." });
    } finally {
      setPending(false);
    }
  };

  const resendActivationLink = async (account: Account) => {
    setPending(true);
    setNotice(null);
    try {
      if (isDemo) {
        setNotice({ kind: "success", text: "Tryb demonstracyjny: link aktywacyjny nie jest wysyłany." });
      } else {
        const response = await fetch("/api/broker/administrator-accounts", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "resend-invite", accountId: account.id }),
        });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Nie udało się wysłać linku aktywacyjnego.");
        setNotice({ kind: "success", text: `Nowy link aktywacyjny został wysłany na adres ${account.email || "użytkownika"}.` });
        router.refresh();
      }
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się wysłać linku aktywacyjnego." });
    } finally {
      setPending(false);
    }
  };

  return <section className="account-directory panel">
    <div className="account-directory__heading"><span><UsersRound size={19}/></span><div><p className="kicker">Konta administratorów</p><h2>Edytuj konto</h2><p>Możesz zmienić dane użytkownika lub przenieść konto do innej firmy. Hasłem zarządza wyłącznie jego właściciel.</p></div></div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    {editing && <form className="account-directory__form" onSubmit={save}><label>Firma administrująca<select required value={editing.companyId} onChange={(event) => setEditing({ ...editing, companyId: event.target.value })}><option value="">Wybierz firmę</option>{companies.map((company) => <option value={company.id} key={company.id}>{company.name}</option>)}</select></label><label>Imię i nazwisko<input required value={editing.fullName} onChange={(event) => setEditing({ ...editing, fullName: event.target.value })}/></label><label>E-mail<input required type="email" value={editing.email} onChange={(event) => setEditing({ ...editing, email: event.target.value })}/></label><button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : "Zapisz konto"}</button><button className="button button-ghost" type="button" onClick={() => setEditing(null)}>Anuluj</button></form>}
    {!accounts.length ? <div className="empty-state"><UsersRound size={24}/><p>Nie dodano jeszcze kont administratorów.</p></div> : <div className="account-directory__list">{accounts.map((account) => <article key={account.id} className="account-directory__item"><div><strong>{account.full_name || "Administrator bez nazwy"}</strong><span>{account.email || "Brak e-maila"}</span><small>{companies.find((company) => company.id === account.administrator_company_id)?.name || "Brak przypisanej firmy"}</small><small className={`account-activation ${account.account_activated_at ? "account-activation--active" : "account-activation--pending"}`}>{account.account_activated_at ? <><BadgeCheck size={13}/>Konto aktywne</> : <><Clock3 size={13}/>Oczekuje na ustawienie hasła</>}</small></div><div className="account-directory__actions">{!account.account_activated_at && <button className="button button-ghost account-resend-button" type="button" disabled={pending} onClick={() => resendActivationLink(account)}>{pending ? <LoaderCircle className="spin" size={14}/> : <MailCheck size={14}/>}Wyślij link aktywacyjny ponownie</button>}<button className="button button-ghost" type="button" disabled={pending} onClick={() => startEditing(account)}><Pencil size={14}/>Edytuj</button></div></article>)}</div>}
  </section>;
}
