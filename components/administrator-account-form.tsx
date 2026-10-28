"use client";

import { AlertCircle, CheckCircle2, LoaderCircle, UserPlus } from "lucide-react";
import { FormEvent, useState } from "react";
import { useRouter } from "next/navigation";

type Company = { id: string; name: string; nip?: string | null };
type Notice = { kind: "success" | "error"; text: string } | null;
const emptyForm = { fullName: "", email: "" };

export function AdministratorAccountForm({ company, isDemo = false }: { company: Company; isDemo?: boolean }) {
  const router = useRouter();
  const [form, setForm] = useState(emptyForm);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<Notice>(null);

  const submit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setNotice(null);
    setPending(true);
    try {
      if (isDemo) {
        setNotice({ kind: "success", text: "Tryb demonstracyjny: konto nie jest zapisywane trwale." });
      } else {
        const response = await fetch("/api/broker/administrator-accounts", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, companyId: company.id }) });
        const result = await response.json().catch(() => ({}));
        if (!response.ok) throw new Error(result.error || "Nie udało się utworzyć konta administratora.");
        setNotice({ kind: "success", text: "Zaproszenie z linkiem do ustawienia hasła zostało wysłane na podany adres e-mail." });
        setForm(emptyForm);
        router.refresh();
      }
    } catch (error) {
      setNotice({ kind: "error", text: error instanceof Error ? error.message : "Nie udało się utworzyć konta administratora." });
    } finally {
      setPending(false);
    }
  };

  return <section className="administrator-account-form panel">
    <div className="administrator-account-form__heading"><span><UserPlus size={19}/></span><div><p className="kicker">Dostępy administratorów</p><h2>Utwórz konto administratora</h2><p>Nowe konto otrzyma dostęp do wspólnot firmy: <b>{company.name}</b>. Użytkownik sam ustawi swoje hasło z linku w e-mailu.</p></div></div>
    {notice && <p className={`community-notice community-notice--${notice.kind}`} role="status">{notice.kind === "success" ? <CheckCircle2 size={16}/> : <AlertCircle size={16}/>} {notice.text}</p>}
    <form className="administrator-account-form__fields" onSubmit={submit}>
      <label>Imię i nazwisko użytkownika<input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="np. Anna Kowalska"/></label>
      <label>Adres e-mail<input required type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="anna@firma.pl"/></label>
      <button className="button button-primary" type="submit" disabled={pending}>{pending ? <LoaderCircle className="spin" size={16}/> : <UserPlus size={16}/>}Wyślij zaproszenie</button>
    </form>
  </section>;
}
