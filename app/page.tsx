import { Building2, CheckCircle2, ClipboardPenLine, FileCheck2, FileText, ShieldCheck, TrendingUp } from "lucide-react";
import { LoginForm } from "@/components/login-form";

const features = [
  { icon: Building2, title: "Wspólnoty w jednym miejscu", text: "Przypisz każdą obsługiwaną wspólnotę do konta administratora." },
  { icon: FileText, title: "Pełna dokumentacja szkody", text: "Dodaj opis, fotografie, faktury i kosztorysy przy jednym zgłoszeniu." },
  { icon: CheckCircle2, title: "Status bez telefonów", text: "Każda strona widzi aktualny etap obsługi i historię zmian." },
];

const workflow = [
  { icon: ClipboardPenLine, label: "Zgłaszaj" },
  { icon: FileCheck2, label: "Dokumentuj" },
  { icon: TrendingUp, label: "Kontroluj postęp" },
];

export default function HomePage() {
  return (
    <main className="landing">
      <section className="hero">
        <div className="hero-logo-stage"><img className="hero-brand-logo" src="/etw-broker-logo.png" alt="ETW Broker" /></div>
        <div className="eyebrow"><ShieldCheck size={15} /> Platforma obsługi szkód</div>
        <h1>Sprawna droga<br />od szkody do <em>wypłaty.</em></h1>
        <p>Jedno miejsce dla administratorów wspólnot i brokera ubezpieczeniowego.</p>
        <div className="hero-workflow" aria-label="Proces obsługi szkody">
          {workflow.map(({ icon: Icon, label }) => <div className="workflow-step" key={label}><span><Icon size={25} /></span><strong>{label}</strong></div>)}
        </div>
        <div className="hero-login"><p>Zaloguj się do swojego panelu</p><LoginForm variant="hero" /></div>
      </section>

      <section className="feature-grid">
        {features.map(({ icon: Icon, title, text }) => <article key={title} className="feature-card"><Icon /><h2>{title}</h2><p>{text}</p></article>)}
      </section>
      <footer>ETW Broker &copy; {new Date().getFullYear()} · Panel dla wspólnot mieszkaniowych</footer>
    </main>
  );
}
