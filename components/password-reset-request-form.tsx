"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { createClient } from "@/lib/supabase/client";

export function PasswordResetRequestForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setPending(true);
    setError(null);
    setNotice(null);
    try {
      const supabase = createClient();
      const { error: requestError } = await supabase.auth.resetPasswordForEmail(email.trim(), {
        redirectTo: `${window.location.origin}/auth/set-password`,
      });
      if (requestError) throw requestError;
      setNotice("Jeżeli konto istnieje, na podany adres wysłaliśmy link do ustawienia nowego hasła.");
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nie udało się wysłać linku do zmiany hasła.");
    } finally {
      setPending(false);
    }
  }

  return <form className="form-stack" onSubmit={submit}>
    <div className="field"><label htmlFor="reset-email">Adres e-mail</label><input id="reset-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="anna@firma.pl" autoComplete="email" required/></div>
    {notice && <p className="password-notice password-notice--success"><CheckCircle2 size={16}/>{notice}</p>}
    {error && <p className="error-message">{error}</p>}
    <button className="button button-primary" disabled={pending}>{pending ? <LoaderCircle size={16} className="spin"/> : <>Wyślij link <ArrowRight size={16}/></>}</button>
  </form>;
}
