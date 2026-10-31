import { EmailNotificationTemplate } from "@/components/email-notification-template";

export const metadata = {
  title: "Zaproszenie do konta | ETW Broker",
};

export default function AccountInviteEmailPreviewPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "42px 18px", background: "#e8e7e9" }}>
      <div style={{ width: "min(100%, 620px)", margin: "0 auto 20px", fontFamily: "Manrope, Arial, sans-serif" }}>
        <p style={{ margin: 0, color: "#ce0030", fontSize: "11px", fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase" }}>Podgląd szablonu</p>
        <h1 style={{ margin: "6px 0 0", color: "#151517", fontSize: "25px", letterSpacing: "-0.9px" }}>Zaproszenie do konta ETW Broker</h1>
        <p style={{ margin: "7px 0 0", color: "#6d6c70", fontSize: "13px", lineHeight: 1.55 }}>
          Wiadomość jest automatycznie wysyłana po utworzeniu konta przez brokera.
        </p>
      </div>
      <EmailNotificationTemplate
        recipientName="Anna Kowalska"
        title="Twoje konto jest gotowe do aktywacji"
        message="Broker utworzył dla Ciebie dostęp do Centrum obsługi szkód ETW Broker. Ustaw własne hasło, aby aktywować konto i rozpocząć pracę w panelu."
        contextLabel="Dostęp do panelu"
        contextTitle="Firma Administracja Przykład"
        contextDescription="Po ustawieniu hasła uzyskasz dostęp do wspólnot obsługiwanych przez tę firmę."
        ctaLabel="Ustaw hasło"
        ctaUrl="/auth/set-password"
        logoUrl="/etw-broker-logo.png"
        resources={{
          title: "Poznaj panel przed pierwszym logowaniem",
          description: "Film i instrukcja pomogą szybko rozpocząć pracę w panelu.",
          links: [
            { label: "Obejrzyj film instruktażowy na YouTube", href: "https://www.youtube.com/watch?v=Tz0nUwJP12g" },
            { label: "Pobierz instrukcję PDF", href: "/instrukcje/ETW-Broker-instrukcja-uzytkownika.pdf" },
          ],
        }}
      />
    </main>
  );
}
