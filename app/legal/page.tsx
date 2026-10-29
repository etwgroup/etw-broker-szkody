import { ArrowLeft, FileText, Scale } from "lucide-react";
import Link from "next/link";
import { Brand } from "@/components/brand";
import { LegalFooter } from "@/components/legal-footer";
import { legalDocuments } from "@/lib/legal-content";

export const metadata = { title: "Informacje prawne | ETW Broker" };

export default function LegalPage() {
  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Brand compact />
        <Link href="/login" className="legal-back"><ArrowLeft size={15} /> Wróć do logowania</Link>
      </header>
      <section className="legal-overview">
        <p className="kicker"><Scale size={13} /> Informacje prawne</p>
        <h1>Dokumenty i zasady korzystania z platformy</h1>
        <p>W jednym miejscu znajdziesz zasady przetwarzania danych, korzystania z Centrum obsługi szkód oraz dane podmiotu prowadzącego platformę.</p>
      </section>
      <section className="legal-document-grid" aria-label="Dokumenty prawne">
        {legalDocuments.map((document) => (
          <Link className="legal-document-card" href={`/legal/${document.slug}`} key={document.slug}>
            <FileText size={20} />
            <h2>{document.label}</h2>
            <p>{document.lead}</p>
            <span>Otwórz dokument →</span>
          </Link>
        ))}
      </section>
      <LegalFooter variant="landing" />
    </main>
  );
}

