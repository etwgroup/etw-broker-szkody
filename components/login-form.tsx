"use client";

import { FormEvent, useState } from "react";
import { ArrowRight, LoaderCircle } from "lucide-react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export function LoginForm({ variant = "default" }: { variant?: "default" | "hero" }) {
  const router = useRouter();
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault(); setError(null); setLoading(true);
    const form = new FormData(event.currentTarget);
    try {
      const demoResponse = await fetch("/api/demo-login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: String(form.get("email")), password: String(form.get("password")) }) });
      if (demoResponse.ok) {
        const { role } = await demoResponse.json();
        router.replace(role === "broker" ? "/broker" : "/admin"); router.refresh(); return;
      }
      const supabase = createClient();
      const { error: authError } = await supabase.auth.signInWithPassword({ email: String(form.get("email")), password: String(form.get("password")) });
      if (authError) throw authError;
      const { data: { user } } = await supabase.auth.getUser();
      const { data: profile } = await supabase.from("profiles").select("role").eq("id", user?.id).single();
      router.replace(profile?.role === "broker" ? "/broker" : "/admin"); router.refresh();
    } catch (reason) { setError(reason instanceof Error ? reason.message : "Nie udało się zalogować."); }
    finally { setLoading(false); }
  }
  return <form className={`form-stack ${variant === "hero" ? "hero-login-form" : ""}`} onSubmit={handleSubmit}>
    <div className="field"><label htmlFor="email">Adres e-mail</label><input id="email" name="email" type="email" placeholder="jan@administracja.pl" autoComplete="email" required/></div>
    <div className="field"><label htmlFor="password">Hasło</label><input id="password" name="password" type="password" autoComplete="current-password" required/></div>
    {error && <p className="error-message">{error}</p>}
    <button className="button button-primary" disabled={loading}>{loading ? <LoaderCircle size={16} className="spin"/> : <>{variant === "hero" ? "Zaloguj się" : "Zaloguj się"} <ArrowRight size={16}/></>}</button>
  </form>;
}
