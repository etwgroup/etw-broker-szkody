import { formatCurrency, statusMeta, type ClaimStatus } from "@/lib/claims";

export type ClaimEmailRecipient = {
  email: string | null;
  full_name: string | null;
};

export type ClaimEmailContext = {
  id: string;
  reference: string;
  title: string;
  status: string;
  insurer_claim_number?: string | null;
  paid_amount?: string | number | null;
  community_name: string;
  community_address: string;
  administrator_company_id: string | null;
};

export type ClaimEmailKind = "claim_created" | "broker_message" | "administrator_message" | "status_changed";

function configuredApplicationUrl(request: Request) {
  const configuredUrl = process.env.NEXT_PUBLIC_APP_URL?.trim();
  return (configuredUrl || new URL(request.url).origin).replace(/\/$/, "");
}

function readableStatus(status: string) {
  return status in statusMeta ? statusMeta[status as ClaimStatus].label : "Zmieniony";
}

function uniqueRecipients(recipients: ClaimEmailRecipient[]) {
  const known = new Set<string>();
  return recipients.filter((recipient) => {
    const email = recipient.email?.trim().toLowerCase();
    if (!email || !email.includes("@") || known.has(email)) return false;
    known.add(email);
    return true;
  });
}

function escapeHtml(value: string) {
  return value.replace(/[&<>'"]/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[character] || character);
}

/**
 * A string version of EmailNotificationTemplate for the Resend API.
 * It intentionally relies only on inline styles, which are safe for e-mail clients.
 */
function renderClaimEmailTemplate({
  recipientName,
  title,
  message,
  contextLabel,
  contextTitle,
  contextDescription,
  ctaLabel,
  ctaUrl,
  logoUrl,
}: {
  recipientName: string;
  title: string;
  message: string;
  contextLabel: string;
  contextTitle: string;
  contextDescription: string;
  ctaLabel: string;
  ctaUrl: string;
  logoUrl: string;
}) {
  const person = escapeHtml(recipientName);
  const heading = escapeHtml(title);
  const copy = escapeHtml(message);
  const label = escapeHtml(contextLabel);
  const context = escapeHtml(contextTitle);
  const description = escapeHtml(contextDescription);
  const button = escapeHtml(ctaLabel);
  const actionUrl = escapeHtml(ctaUrl);
  const imageUrl = escapeHtml(logoUrl);

  return `<!doctype html>
<html lang="pl"><body style="margin:0;padding:0;background:#f4f3f4;color:#151517;">
  <div style="width:100%;padding:32px 16px;background:#f4f3f4;box-sizing:border-box;">
    <table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;max-width:620px;margin:0 auto;background:#ffffff;border-collapse:separate;border-spacing:0;border-radius:6px;overflow:hidden;box-shadow:0 14px 40px rgba(21,21,23,.12);font-family:Arial,Helvetica,sans-serif;">
      <tbody>
        <tr><td style="height:5px;background:#ce0030;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td style="padding:26px 32px 18px;"><table role="presentation" cellspacing="0" cellpadding="0" style="border-collapse:collapse;"><tbody><tr>
          <td style="width:56px;vertical-align:middle;"><img src="${imageUrl}" alt="ETW Broker" width="52" height="52" style="display:block;width:52px;height:52px;object-fit:contain;"></td>
          <td style="padding-left:12px;vertical-align:middle;color:#ce0030;font-size:13px;font-weight:800;letter-spacing:1.45px;line-height:1.25;text-transform:uppercase;">Centrum obsługi szkód</td>
        </tr></tbody></table></td></tr>
        <tr><td style="padding:8px 32px 0;"><p style="margin:0;color:#151517;font-size:15px;line-height:1.5;">Dzień dobry, ${person},</p><h1 style="margin:14px 0 0;color:#151517;font-size:26px;line-height:1.18;font-weight:800;letter-spacing:-.8px;">${heading}</h1><p style="margin:12px 0 0;color:#6d6c70;font-size:15px;line-height:1.65;">${copy}</p></td></tr>
        <tr><td style="padding:22px 32px 0;"><table role="presentation" cellspacing="0" cellpadding="0" style="width:100%;border-collapse:separate;border-spacing:0;background:#fff0f3;border-left:3px solid #ce0030;"><tbody><tr><td style="padding:15px 17px;"><p style="margin:0;color:#ce0030;font-size:10px;font-weight:700;letter-spacing:1.1px;text-transform:uppercase;">${label}</p><p style="margin:5px 0 0;color:#151517;font-size:14px;font-weight:800;">${context}</p><p style="margin:3px 0 0;color:#6d6c70;font-size:13px;line-height:1.5;">${description}</p></td></tr></tbody></table></td></tr>
        <tr><td style="padding:24px 32px 32px;"><a href="${actionUrl}" style="display:inline-block;padding:13px 21px;color:#ffffff;background:#ce0030;border-radius:4px;font-size:14px;font-weight:700;line-height:1;text-decoration:none;">${button}&nbsp;&nbsp;→</a></td></tr>
        <tr><td style="padding:20px 32px;background:#171719;border-top:1px solid #e4e3e5;"><p style="margin:0;color:#ffffff;font-size:12px;font-weight:700;">ETW Broker · obsługa szkód wspólnot mieszkaniowych</p><p style="margin:6px 0 0;color:#b9b7bb;font-size:11px;line-height:1.5;">To automatyczne powiadomienie. Aby odpowiedzieć, otwórz sprawę w panelu ETW Broker.</p><p style="margin:7px 0 0;color:#dedce0;font-size:11px;font-weight:700;line-height:1.5;">Prosimy nie odpowiadać bezpośrednio na tę wiadomość e-mail.</p></td></tr>
      </tbody>
    </table>
  </div>
</body></html>`;
}

function messageFor(kind: ClaimEmailKind, claim: ClaimEmailContext) {
  const caseTitle = `${claim.reference} · ${claim.title}`;

  if (kind === "claim_created") {
    return {
      subject: `Nowe zgłoszenie szkody · ${claim.reference}`,
      title: "Nowe zgłoszenie szkody",
      message: "Administrator zgłosił nową szkodę. Otwórz sprawę w panelu, aby zapoznać się z opisem oraz załączoną dokumentacją.",
      contextLabel: "Nowe zgłoszenie",
      contextTitle: caseTitle,
      contextDescription: `${claim.community_name} · ${claim.community_address}`,
      ctaLabel: "Otwórz zgłoszenie",
      path: `/broker/damages/${claim.id}`,
    };
  }

  if (kind === "broker_message") {
    return {
      subject: `Nowa odpowiedź brokera · ${claim.reference}`,
      title: "Broker odpowiedział w sprawie",
      message: "Otrzymano nową wiadomość od brokera. Otwórz sprawę w panelu, aby zapoznać się z jej treścią i ewentualnymi załącznikami.",
      contextLabel: "Komunikacja w sprawie",
      contextTitle: caseTitle,
      contextDescription: `${claim.community_name} · ${claim.community_address}`,
      ctaLabel: "Otwórz sprawę",
      path: `/admin/damages/${claim.id}`,
    };
  }

  if (kind === "administrator_message") {
    return {
      subject: `Nowa odpowiedź administratora · ${claim.reference}`,
      title: "Administrator odpowiedział w sprawie",
      message: "Otrzymano nową wiadomość od administratora. Otwórz sprawę w panelu, aby zapoznać się z jej treścią i ewentualnymi załącznikami.",
      contextLabel: "Komunikacja w sprawie",
      contextTitle: caseTitle,
      contextDescription: `${claim.community_name} · ${claim.community_address}`,
      ctaLabel: "Otwórz sprawę",
      path: `/broker/damages/${claim.id}`,
    };
  }

  const extra = [
    `Nowy status: ${readableStatus(claim.status)}`,
    claim.status === "insurer_claim_number_assigned" && claim.insurer_claim_number ? `Numer ubezpieczyciela: ${claim.insurer_claim_number}` : null,
    claim.status === "paid" && claim.paid_amount != null ? `Kwota wypłaty: ${formatCurrency(claim.paid_amount)}` : null,
  ].filter(Boolean).join(" · ");

  return {
    subject: `Zmiana statusu szkody · ${claim.reference}`,
    title: "Status szkody został zmieniony",
    message: "Broker zaktualizował etap obsługi szkody. Otwórz sprawę w panelu, aby zobaczyć pełną historię oraz aktualne informacje.",
    contextLabel: "Aktualizacja szkody",
    contextTitle: caseTitle,
    contextDescription: extra,
    ctaLabel: "Sprawdź status",
    path: `/admin/damages/${claim.id}`,
  };
}

/**
 * Delivers the same ETW Broker template that is visible under /email-preview.
 * Delivery errors are deliberately logged but never roll back a saved claim,
 * message or status update.
 */
export async function sendClaimEmails({
  request,
  kind,
  claim,
  recipients,
}: {
  request: Request;
  kind: ClaimEmailKind;
  claim: ClaimEmailContext;
  recipients: ClaimEmailRecipient[];
}) {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  const appUrl = configuredApplicationUrl(request);
  const delivery = messageFor(kind, claim);
  const targets = uniqueRecipients(recipients);

  if (!apiKey) {
    console.warn("Nie wysłano e-maili dotyczących szkody: brakuje zmiennej RESEND_API_KEY.");
    return { attempted: 0, sent: 0, configured: false };
  }

  const from = process.env.RESEND_FROM?.trim() || "ETW Broker <powiadomienia@mail.etwbroker.pl>";
  const logoUrl = `${appUrl}/etw-broker-logo.png`;
  const ctaUrl = `${appUrl}${delivery.path}`;
  const results = await Promise.allSettled(targets.map(async (recipient) => {
    const html = renderClaimEmailTemplate({
      recipientName: recipient.full_name?.trim() || "Użytkowniku",
      title: delivery.title,
      message: delivery.message,
      contextLabel: delivery.contextLabel,
      contextTitle: delivery.contextTitle,
      contextDescription: delivery.contextDescription,
      ctaLabel: delivery.ctaLabel,
      ctaUrl,
      logoUrl,
    });

    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${apiKey}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        from,
        to: [recipient.email],
        subject: delivery.subject,
        html,
      }),
    });

    if (!response.ok) {
      const details = await response.text().catch(() => "");
      throw new Error(`Resend ${response.status}: ${details.slice(0, 300)}`);
    }
  }));

  const sent = results.filter((result) => result.status === "fulfilled").length;
  const failed = results.filter((result) => result.status === "rejected");
  if (failed.length) {
    console.error("Nie udało się wysłać części e-maili dotyczących szkody.", failed.map((result) => result.reason));
  }

  return { attempted: targets.length, sent, configured: true };
}
