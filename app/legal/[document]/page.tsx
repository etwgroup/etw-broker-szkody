import { ArrowLeft, CalendarDays, FileText } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Brand } from "@/components/brand";
import { LegalFooter } from "@/components/legal-footer";
import { legalDocuments, legalDocumentsBySlug } from "@/lib/legal-content";

export function generateStaticParams() {
  return legalDocuments.map(({ slug }) => ({ document: slug }));
}

export default async function LegalDocumentPage({ params }: { params: Promise<{ document: string }> }) {
  const { document: slug } = await params;
  const document = legalDocumentsBySlug[slug as keyof typeof legalDocumentsBySlug];
  if (!document) notFound();

  return (
    <main className="legal-shell">
      <header className="legal-header">
        <Brand compact />
        <Link href="/legal" className="legal-back"><ArrowLeft size={15} /> Wszystkie dokumenty</Link>
      </header>
      <article className="legal-article">
        <div className="legal-article__heading">
          <span><FileText size={22} /></span>
          <div>
            <p className="kicker">ETW Broker · dokument prawny</p>
            <h1>{document.title}</h1>
            <p>{document.lead}</p>
            <small><CalendarDays size={13} /> Ostatnia aktualizacja: {document.updatedAt}</small>
          </div>
        </div>
        <div className="legal-article__content">
          {document.sections.map((section) => (
            <section key={section.title}>
              <h2>{section.title}</h2>
              {section.paragraphs?.map((paragraph) => <p key={paragraph}>{paragraph}</p>)}
              {section.items && <ul>{section.items.map((item) => <li key={item}>{item}</li>)}</ul>}
            </section>
          ))}
          {document.slug === "broker" && <a className="legal-external-link" href="https://rpu.knf.gov.pl/search" target="_blank" rel="noreferrer">Sprawdź wpis w rejestrze KNF →</a>}
        </div>
      </article>
      <LegalFooter variant="landing" />
    </main>
  );
}

