# ETW Broker Szkody

Panel dla administratorów wspólnot mieszkaniowych i brokera ubezpieczeniowego. Administrator zgłasza szkodę wraz z dokumentacją, a broker prowadzi ją przez cały proces obsługi.

## Zakres aplikacji

- dwa typy kont: `administrator` i `broker`, zarządzane przez Supabase Auth;
- wspólnoty przypisane do firm administrujących, nie do pojedynczych kont;
- wiele kont administratorów w jednej firmie, ze wspólnym dostępem do jej wspólnot;
- zgłoszenia szkód z opisem, datą zdarzenia oraz plikami (zdjęcia, faktury, kosztorysy);
- statusy: nowa, przyjęta, zgłoszona do ubezpieczyciela, przypisany numer szkody przez ubezpieczyciela, odrzucona, zaakceptowana i wypłacona;
- wymagany numer szkody, gdy broker wybierze status „Przypisany numer szkody przez ubezpieczyciela”;
- prywatne dokumenty szkód i polis, reguły RLS, historia statusów oraz dwustronna komunikacja przy szkodzie;
- widoki dla brokera: szkody, wspólnoty i administratorzy;
- ręczne dodawanie wspólnot do firmy oraz import zbiorczego wykazu Excel jako wspólnot nieprzypisanych.

## Wymagania

- Node.js `20.9.0` lub nowszy;
- `pnpm`;
- konto Supabase;
- konto GitHub i Vercel.

## 1. Konfiguracja Supabase

1. Utwórz projekt w [Supabase](https://supabase.com/dashboard/projects).
2. Otwórz **SQL Editor**.
3. Uruchom zawartość poniższych plików **po kolei**, każdy jako osobne zapytanie:

   1. `supabase/migrations/202610220001_initial_schema.sql`
   2. `supabase/migrations/202610220002_insurance_policies.sql`
   3. `supabase/migrations/202610220003_insurer_claim_number_status.sql`
   4. `supabase/migrations/202610220004_insurer_claim_number_field.sql`
   5. `supabase/migrations/202610220005_administrator_companies.sql`
   6. `supabase/migrations/202610220006_company_accounts_and_community_refresh.sql`
   7. `supabase/migrations/202610220007_policy_company_access.sql`
   8. `supabase/migrations/202610220008_claim_conversation.sql`
   9. `supabase/migrations/202610220009_claim_last_message.sql`
   10. `supabase/migrations/202610220010_claim_reporter.sql`

   Trzecia i czwarta migracja muszą zostać wykonane osobno. PostgreSQL udostępnia nową wartość statusu dopiero po zatwierdzeniu poprzedniego zapytania.

4. W **Project Settings → API** skopiuj:

   - **Project URL**;
   - **Publishable key**.

   Klucz **Secret key** (`sb_secret_...`) będzie potrzebny wyłącznie jako prywatna zmienna Vercel `SUPABASE_SECRET_KEY` do tworzenia kont administratorów. Nigdy nie używaj przedrostka `NEXT_PUBLIC_` ani nie umieszczaj go w repozytorium.

5. W **Authentication → URL Configuration** ustaw adres produkcyjny aplikacji jako **Site URL**. Do listy **Redirect URLs** dodaj co najmniej:

   ```text
   http://localhost:3000/**
   https://TWOJ-PROJEKT.vercel.app/**
   ```

   Jeżeli używasz własnej domeny, dodaj również `https://twoja-domena.pl/**`.

## 2. Konta, role i dane startowe

1. W **Authentication → Users** utwórz konto e-mail/hasło dla brokera.
2. Aby nadać temu użytkownikowi rolę brokera, uruchom w SQL Editor:

   ```sql
   update public.profiles
   set role = 'broker'
   where id = '<UUID użytkownika z Authentication>';
   ```

3. W **Authentication → Users** utwórz osobne konto dla administratora. Nie wymaga ono dodatkowego zapytania SQL — otrzymuje rolę `administrator` automatycznie.
4. Na etapie wdrożenia nie dodawaj jeszcze wspólnot. Ich przypisanie oraz polisy są elementem późniejszej konfiguracji danych operacyjnych.

## 3. Test lokalny

1. Utwórz plik `.env.local` na podstawie `.env.example`:

   ```bash
   cp .env.example .env.local
   ```

2. Uzupełnij go wartościami z Supabase:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=twoj-publishable-key
   ```

3. Zainstaluj zależności, sprawdź build i uruchom aplikację:

   ```bash
   pnpm install --frozen-lockfile
   pnpm build
   pnpm dev
   ```

4. Otwórz [http://localhost:3000](http://localhost:3000).

> Brak zmiennych Supabase uruchamia wyłącznie tryb demonstracyjny. Nie wdrażaj aplikacji produkcyjnej bez obu zmiennych środowiskowych.

## 4. Publikacja kodu na GitHub

Utwórz puste repozytorium na GitHub, a następnie w katalogu projektu wykonaj:

```bash
git add .
git commit -m "Initial ETW Broker claims portal"
git branch -M main
git remote add origin https://github.com/TWOJ-LOGIN/etw-broker-szkody.git
git push -u origin main
```

Jeżeli `origin` jest już skonfigurowany, pomiń polecenie `git remote add origin`.

## 5. Wdrożenie na Vercel

1. W Vercel wybierz **Add New → Project** i zaimportuj repozytorium GitHub.
2. W polu **Application Preset** wybierz **Next.js** oraz pozostaw katalog główny projektu jako `./`.
3. W **Environment Variables** dodaj poniższe wartości dla środowisk **Production**, **Preview** i **Development**:

   | Nazwa | Wartość |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL z Supabase |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key z Supabase |
   | `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`) z Supabase — prywatna zmienna serwera |

4. Kliknij **Deploy**.
5. Po uzyskaniu adresu Vercel wróć do Supabase i dodaj go w **Authentication → URL Configuration** jako Site URL / Redirect URL, zgodnie z krokiem 1.5.
6. Zaloguj się jako administrator i broker, utwórz testową szkodę oraz sprawdź zmianę statusu wraz z numerem szkody ubezpieczyciela.

Vercel wykona `pnpm build` podczas publikacji. Każdy kolejny push do gałęzi `main` utworzy wdrożenie produkcyjne; pull requesty otrzymają odrębne wdrożenia Preview.

## Aktualizacja działającej aplikacji

Gdy aktualizacja zawiera zmiany w `supabase/migrations/`:

1. Najpierw uruchom nowe migracje w Supabase, w kolejności ich numerów.
2. Lokalnie wykonaj `pnpm build`.
3. Wypchnij kod na `main` lub uruchom redeploy w Vercel.
4. Sprawdź krytyczną ścieżkę: logowanie, tworzenie firmy i konta administratora, import wspólnot, zgłoszenie szkody i zmianę statusu przez brokera.

Migracje nie powinny być pomijane — nowy status z numerem szkody wymaga zarówno migracji `003`, jak i `004`, wspólny dostęp kont jednej firmy do polis wymaga migracji `007`, czat oraz wymiana dokumentów przy szkodzie wymagają migracji `008`, a szybkie powiadomienia o ostatniej odpowiedzi wymagają migracji `009`.

## Bezpieczeństwo

- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` jest kluczem przeznaczonym do użycia po stronie aplikacji; bezpieczeństwo danych egzekwują reguły RLS w Supabase.
- Nigdy nie dodawaj `SUPABASE_SECRET_KEY`, haseł ani pliku `.env.local` do repozytorium lub zmiennych dostępnych po stronie klienta.
- Dostęp do szkód, polis i plików opiera się na przypisaniu wspólnoty oraz roli użytkownika.
