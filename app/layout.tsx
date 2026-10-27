import type { Metadata } from "next";
import "./globals.css";
import "./status.css";

export const metadata: Metadata = {
  title: "ETW Broker | Panel ubezpieczeniowy",
  description: "Zgłaszanie i obsługa szkód dla wspólnot mieszkaniowych.",
  icons: {
    icon: "/etw-broker-logo.png",
    apple: "/etw-broker-logo.png",
  },
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
