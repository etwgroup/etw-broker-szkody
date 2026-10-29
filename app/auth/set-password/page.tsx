import { Brand } from "@/components/brand";
import { LegalFooter } from "@/components/legal-footer";
import { SetPasswordForm } from "@/components/set-password-form";

export const metadata = { title: "Ustaw hasło | ETW Broker" };

export default function SetPasswordPage() {
  return <main className="login-shell"><section className="login-card"><div className="login-brand"><Brand compact/></div><h1>Ustaw swoje hasło</h1><p>Wybierz hasło, aby aktywować konto lub odzyskać dostęp do panelu.</p><SetPasswordForm/><p className="login-note">Po zapisaniu hasła wrócisz do strony logowania.</p></section><LegalFooter /></main>;
}
