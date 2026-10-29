import { Scale } from "lucide-react";
import Link from "next/link";

const legalLinks = [
  { href: "/legal/privacy", label: "Polityka prywatności" },
  { href: "/legal/cookies", label: "Polityka cookies" },
  { href: "/legal/terms", label: "Regulamin platformy" },
  { href: "/legal/broker", label: "Informacje o brokerze" },
  { href: "/legal/complaints", label: "Reklamacje" },
];

export function LegalFooter({ variant = "login" }: { variant?: "login" | "landing" }) {
  return (
    <footer className={`legal-footer legal-footer--${variant}`} aria-label="Informacje prawne">
      <div className="legal-footer__identity">
        <Scale size={14} aria-hidden="true" />
        <span>ETW BROKER Jessica Klimiuk-Waszczuk · NIP 5423250008 · REGON 362974061</span>
      </div>
      <nav className="legal-footer__links" aria-label="Dokumenty prawne">
        {legalLinks.map((link) => <Link href={link.href} key={link.href}>{link.label}</Link>)}
      </nav>
      <p>Centrum obsługi szkód wspólnot mieszkaniowych · © {new Date().getFullYear()} ETW Broker</p>
    </footer>
  );
}

