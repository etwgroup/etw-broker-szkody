import type { Metadata } from "next";
import "./globals.css";
import "./status.css";

export const metadata: Metadata = {
  title: "ETW Szkody | Panel ubezpieczeniowy",
  description: "Zgłaszanie i obsługa szkód dla wspólnot mieszkaniowych.",
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pl">
      <body>{children}</body>
    </html>
  );
}
