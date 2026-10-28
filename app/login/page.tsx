import { LoginForm } from "@/components/login-form";
import { Brand } from "@/components/brand";

export default function LoginPage() {
  return <main className="login-shell"><section className="login-card"><div className="login-brand"><Brand compact/></div><h1>Witaj ponownie</h1><p>Zaloguj się do bezpiecznego panelu zgłaszania i obsługi szkód.</p><LoginForm/><p className="login-note">Konto zakłada broker ubezpieczeniowy. Jeśli nie masz dostępu, skontaktuj się z opiekunem swojej wspólnoty.</p></section></main>;
}
