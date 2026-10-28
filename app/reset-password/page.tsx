import Link from "next/link";
import { Brand } from "@/components/brand";
import { PasswordResetRequestForm } from "@/components/password-reset-request-form";

export const metadata = { title: "Reset hasła | ETW Broker" };

export default function ResetPasswordPage() {
  return <main className="login-shell"><section className="login-card"><div className="login-brand"><Brand compact/></div><h1>Ustaw nowe hasło</h1><p>Podaj adres e-mail konta. Wyślemy bezpieczny link do ustawienia nowego hasła.</p><PasswordResetRequestForm/><p className="login-note"><Link href="/login">Wróć do logowania</Link></p></section></main>;
}
