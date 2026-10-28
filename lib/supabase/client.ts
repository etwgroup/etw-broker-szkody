import { createBrowserClient } from "@supabase/ssr";

function credentials() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;

  if (!url || !key) {
    throw new Error("Brakuje konfiguracji Supabase. Uzupełnij plik .env.local.");
  }

  return { url, key };
}

export function createClient() {
  const { url, key } = credentials();
  return createBrowserClient(url, key);
}

/**
 * Linki zaproszenia i resetu hasła są wysyłane przez serwer Supabase.
 * Otrzymują więc token w adresie URL (implicit flow), a nie kod PKCE
 * powiązany z przeglądarką, która wcześniej rozpoczęła logowanie.
 */
export function createPasswordLinkClient() {
  const { url, key } = credentials();
  return createBrowserClient(url, key, {
    isSingleton: false,
    auth: {
      flowType: "implicit",
      detectSessionInUrl: true,
    },
  });
}
