import type { CSSProperties } from "react";

export type EmailNotificationTemplateProps = {
  recipientName: string;
  title: string;
  message: string;
  contextLabel: string;
  contextTitle: string;
  contextDescription: string;
  ctaLabel: string;
  ctaUrl: string;
  logoUrl: string;
  resources?: {
    title: string;
    description: string;
    links: Array<{ label: string; href: string }>;
  };
};

const colors = {
  ink: "#151517",
  muted: "#6d6c70",
  red: "#ce0030",
  paleRed: "#fff0f3",
  line: "#e4e3e5",
  canvas: "#f4f3f4",
};

const textStyle: CSSProperties = {
  margin: 0,
  color: colors.ink,
  fontFamily: "Arial, Helvetica, sans-serif",
};

/**
 * A shared, e-mail-safe layout for all ETW Broker notifications.
 * When delivery is enabled, only the content props change per event.
 */
export function EmailNotificationTemplate({
  recipientName,
  title,
  message,
  contextLabel,
  contextTitle,
  contextDescription,
  ctaLabel,
  ctaUrl,
  logoUrl,
  resources,
}: EmailNotificationTemplateProps) {
  return (
    <div
      style={{
        width: "100%",
        padding: "32px 16px",
        backgroundColor: colors.canvas,
        color: colors.ink,
      }}
    >
      <table
        cellPadding="0"
        cellSpacing="0"
        role="presentation"
        style={{
          width: "100%",
          maxWidth: "620px",
          margin: "0 auto",
          overflow: "hidden",
          backgroundColor: "#ffffff",
          borderCollapse: "separate",
          borderSpacing: 0,
          borderRadius: "6px",
          boxShadow: "0 14px 40px rgba(21, 21, 23, 0.12)",
        }}
      >
        <tbody>
          <tr>
            <td style={{ height: "5px", backgroundColor: colors.red, fontSize: 0, lineHeight: 0 }}>&nbsp;</td>
          </tr>
          <tr>
            <td style={{ padding: "26px 32px 18px" }}>
              <table cellPadding="0" cellSpacing="0" role="presentation" style={{ borderCollapse: "collapse" }}>
                <tbody>
                  <tr>
                    <td style={{ width: "56px", verticalAlign: "middle" }}>
                      <img
                        src={logoUrl}
                        alt="ETW Broker"
                        width="52"
                        height="52"
                        style={{ display: "block", width: "52px", height: "52px", objectFit: "contain" }}
                      />
                    </td>
                    <td style={{ paddingLeft: "12px", verticalAlign: "middle" }}>
                      <p style={{ ...textStyle, color: colors.red, fontSize: "13px", fontWeight: 800, letterSpacing: "1.45px", lineHeight: "1.25", textTransform: "uppercase" }}>
                        Centrum obsługi szkód
                      </p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "8px 32px 0" }}>
              <p style={{ ...textStyle, fontSize: "15px", lineHeight: "1.5" }}>Dzień dobry, {recipientName},</p>
              <h1 style={{ ...textStyle, marginTop: "14px", fontSize: "26px", lineHeight: "1.18", fontWeight: 800, letterSpacing: "-0.8px" }}>
                {title}
              </h1>
              <p style={{ ...textStyle, marginTop: "12px", color: colors.muted, fontSize: "15px", lineHeight: "1.65" }}>{message}</p>
            </td>
          </tr>
          <tr>
            <td style={{ padding: "22px 32px 0" }}>
              <table
                cellPadding="0"
                cellSpacing="0"
                role="presentation"
                style={{ width: "100%", borderCollapse: "separate", borderSpacing: 0, backgroundColor: colors.paleRed, borderLeft: `3px solid ${colors.red}` }}
              >
                <tbody>
                  <tr>
                    <td style={{ padding: "15px 17px" }}>
                      <p style={{ ...textStyle, color: colors.red, fontSize: "10px", fontWeight: 700, letterSpacing: "1.1px", textTransform: "uppercase" }}>{contextLabel}</p>
                      <p style={{ ...textStyle, marginTop: "5px", fontSize: "14px", fontWeight: 800 }}>{contextTitle}</p>
                      <p style={{ ...textStyle, marginTop: "3px", color: colors.muted, fontSize: "13px", lineHeight: "1.5" }}>{contextDescription}</p>
                    </td>
                  </tr>
                </tbody>
              </table>
            </td>
          </tr>
          <tr>
            <td style={{ padding: resources ? "24px 32px 22px" : "24px 32px 32px" }}>
              <a
                href={ctaUrl}
                style={{
                  display: "inline-block",
                  padding: "13px 21px",
                  color: "#ffffff",
                  backgroundColor: colors.red,
                  borderRadius: "4px",
                  fontFamily: "Arial, Helvetica, sans-serif",
                  fontSize: "14px",
                  fontWeight: 700,
                  lineHeight: "1",
                  textDecoration: "none",
                }}
              >
                {ctaLabel} &nbsp;→
              </a>
            </td>
          </tr>
          {resources && (
            <tr>
              <td style={{ padding: "0 32px 32px" }}>
                <table cellPadding="0" cellSpacing="0" role="presentation" style={{ width: "100%", border: `1px solid ${colors.line}`, borderCollapse: "separate", borderSpacing: 0 }}>
                  <tbody>
                    <tr>
                      <td style={{ padding: "16px 17px 17px" }}>
                        <p style={{ ...textStyle, color: colors.red, fontSize: "10px", fontWeight: 700, letterSpacing: "1.1px", textTransform: "uppercase" }}>Materiały na start</p>
                        <p style={{ ...textStyle, marginTop: "5px", fontSize: "14px", fontWeight: 800 }}>{resources.title}</p>
                        <p style={{ ...textStyle, marginTop: "4px", color: colors.muted, fontSize: "13px", lineHeight: "1.5" }}>{resources.description}</p>
                        {resources.links.map((link, index) => (
                          <p key={link.href} style={{ ...textStyle, marginTop: index === 0 ? "13px" : "7px", fontSize: "13px", fontWeight: 700, lineHeight: "1.5" }}>
                            <a href={link.href} style={{ color: colors.red, textDecoration: "underline" }}>{link.label}&nbsp; →</a>
                          </p>
                        ))}
                      </td>
                    </tr>
                  </tbody>
                </table>
              </td>
            </tr>
          )}
          <tr>
            <td style={{ padding: "20px 32px", backgroundColor: "#171719", borderTop: `1px solid ${colors.line}` }}>
              <p style={{ ...textStyle, color: "#ffffff", fontSize: "12px", fontWeight: 700 }}>ETW Broker · obsługa szkód wspólnot mieszkaniowych</p>
              <p style={{ ...textStyle, marginTop: "6px", color: "#b9b7bb", fontSize: "11px", lineHeight: "1.5" }}>
                To automatyczne powiadomienie. Aby odpowiedzieć, otwórz sprawę w panelu ETW Broker.
              </p>
              <p style={{ ...textStyle, marginTop: "7px", color: "#dedce0", fontSize: "11px", fontWeight: 700, lineHeight: "1.5" }}>
                Prosimy nie odpowiadać bezpośrednio na tę wiadomość e-mail.
              </p>
            </td>
          </tr>
        </tbody>
      </table>
    </div>
  );
}
