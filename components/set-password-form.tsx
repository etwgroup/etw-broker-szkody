"use client";

import { FormEvent, useEffect, useState } from "react";
import { ArrowRight, CheckCircle2, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function SetPasswordForm() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmation, setConfirmation] = useState("");
  const [ready, setReady] = useState(false);
  const [checking, setChecking] = useState(true);
  const [pending, setPending] = useState(false);
  const [notice, setNotice] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const supabase = createClient();
    let mounted = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (!mounted) return;
      setReady(Boolean(data.session));
      setChecking(false);
    });
    const { data: listener } = supabase.auth.onAuthStateChange((_event, session) => {
      if (!mounted) return;
      setReady(Boolean(session));
      setChecking(false);
    });
    return () => { mounted = false; listener.subscription.unsubscribe(); };
  }, []);

  async function submit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setError(null);
    setNotice(null);
    if (password.length < 8) return setError("Hasło musi mieć co najmniej 8 znaków.");
    if (password !== confirmation) return setError("Wpisane hasła nie są takie same.");
    setPending(true);
    try {
      const supabase = createClient();
      const { error: updateError } = await supabase.auth.updateUser({ password });
      if (updateError) throw updateError;
      const { error: activationError } = await supabase.rpc("activate_own_account");
      if (activationError) throw activationError;
      setNotice("Hasło zostało zapisane, a konto jest aktywne. Możesz się teraz zalogować.");
      await supabase.auth.signOut();
      window.setTimeout(() => router.replace("/login"), 1200);
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : "Nie udało się ustawić hasła.");
    } finally {
      setPending(false);
    }
  }

  if (checking) return <p className="password-helper">Sprawdzamy bezpieczny link…</p>;
  if (!ready) return <p className="error-message">Ten link jest nieaktywny lub wygasł. Poproś o nowe zaproszenie albo skorzystaj z resetu hasła.</p>;

  return <form className="form-stack" onSubmit={submit}>
    <div className="field"><label htmlFor="new-password">Nowe hasło</label><input id="new-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} minLength={8} autoComplete="new-password" required/></div>
    <div className="field"><label htmlFor="confirm-password">Powtórz nowe hasło</label><input id="confirm-password" type="password" value={confirmation} onChange={(event) => setConfirmation(event.target.value)} minLength={8} autoComplete="new-password" required/></div>
    {notice && <p className="password-notice password-notice--success"><CheckCircle2 size={16}/>{notice}</p>}
    {error && <p className="error-message">{error}</p>}
    <button className="button button-primary" disabled={pending}>{pending ? <LoaderCircle size={16} className="spin"/> : <>Zapisz hasło <ArrowRight size={16}/></>}</button>
  </form>;
}
