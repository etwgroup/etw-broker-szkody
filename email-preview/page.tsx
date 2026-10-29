import { EmailNotificationTemplate } from "@/components/email-notification-template";

export const metadata = {
  title: "Podgląd e-maila | ETW Broker",
};

export default function EmailPreviewPage() {
  return (
    <main style={{ minHeight: "100vh", padding: "42px 18px", background: "#e8e7e9" }}>
      <div style={{ width: "min(100%, 620px)", margin: "0 auto 20px", fontFamily: "Manrope, Arial, sans-serif" }}>
        <p style={{ margin: 0, color: "#ce0030", fontSize: "11px", fontWeight: 800, letterSpacing: "1.2px", textTransform: "uppercase" }}>Podgląd szablonu</p>
        <h1 style={{ margin: "6px 0 0", color: "#151517", fontSize: "25px", letterSpacing: "-0.9px" }}>Powiadomienie e-mail ETW Broker</h1>
        <p style={{ margin: "7px 0 0", color: "#6d6c70", fontSize: "13px", lineHeight: 1.55 }}>
          Ten układ będzie wspólny dla wszystkich powiadomień. Zmienią się wyłącznie treść i odnośnik do sprawy.
        </p>
      </div>
      <EmailNotificationTemplate
        recipientName="Anna Administrator"
        title="Broker odpowiedział w sprawie"
        message="Jessica Klimiuk-Waszczuk prosi o przekazanie kosztorysu naprawy. Otwórz sprawę, aby zobaczyć pełną wiadomość i odpowiedzieć."
        contextLabel="Dotyczy szkody"
        contextTitle="ETW-2026-01008"
        contextDescription="Zalanie pionu · Wspólnota Mieszkaniowa Młynowa 40"
        ctaLabel="Otwórz szkodę"
        ctaUrl="/admin/damages/demo-claim-1"
        logoUrl="/etw-broker-logo.png"
      />
    </main>
  );
}
