# ETW Broker — prosta instrukcja wdrożenia

Przejdź przez kroki po kolei. Nie przechodź do następnego punktu, dopóki bieżący nie zakończy się powodzeniem.

## Co będzie potrzebne

- konto w Supabase;
- konto GitHub;
- konto Vercel;
- ten katalog projektu ETW Broker.

## Krok 1 — utwórz projekt w Supabase

1. Otwórz [Supabase](https://supabase.com/dashboard) i zaloguj się.
2. Kliknij **New project**.
3. Wybierz organizację, wpisz nazwę, np. `etw-broker-szkody`.
4. Ustaw silne hasło do bazy i zachowaj je w bezpiecznym miejscu.
5. Wybierz region najbliżej Polski (najczęściej Frankfurt).
6. Kliknij **Create new project** i poczekaj, aż projekt będzie gotowy.

## Krok 2 — uruchom strukturę bazy danych

To jest etap, na którym obecnie jesteś. Trzeba uruchomić cztery pliki SQL — **jeden po drugim**.

1. W lewym menu Supabase kliknij **SQL Editor**.
2. Kliknij **New query**.
3. Otwórz pierwszy plik z projektu:

   [202610220001_initial_schema.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/supabase/migrations/202610220001_initial_schema.sql)

4. Zaznacz całą jego zawartość, skopiuj ją do pola edytora SQL w Supabase i kliknij **Run**.
5. Poczekaj na zielony komunikat powodzenia. Dopiero wtedy utwórz kolejne **New query**.
6. W identyczny sposób uruchom następne pliki, w tej dokładnej kolejności:

   1. [202610220002_insurance_policies.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/supabase/migrations/202610220002_insurance_policies.sql)
   2. [202610220003_insurer_claim_number_status.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/supabase/migrations/202610220003_insurer_claim_number_status.sql)
   3. [202610220004_insurer_claim_number_field.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/supabase/migrations/202610220004_insurer_claim_number_field.sql)

> Ważne: plików `003` i `004` nie wklejaj do jednego zapytania. Każdy plik musi być uruchomiony osobno i zakończony sukcesem.

Jeżeli zobaczysz czerwony komunikat błędu, nie uruchamiaj kolejnego pliku. Skopiuj jego treść lub zrób zrzut ekranu i prześlij go do sprawdzenia.

## Krok 3 — pobierz adres i klucz projektu

1. W Supabase kliknij przycisk **Connect** (zwykle w górnej części ekranu projektu).
2. Skopiuj dwie wartości:

   - **Project URL** — zaczyna się od `https://` i kończy na `.supabase.co`;
   - **Publishable key** — zaczyna się od `sb_publishable_`.

   Jeżeli nie widzisz przycisku **Connect**, przejdź do **Settings → API Keys**. Tam znajdziesz adres projektu i klucze.

3. W katalogu projektu ETW Broker utwórz plik `.env.local` obok pliku `package.json`.
4. Wklej do niego wartości w tym formacie:

   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://twoj-projekt.supabase.co
   NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=sb_publishable_tutaj_wklej_calosc
   ```

5. Zapisz plik.

> Nie kopiuj klucza `service_role` ani `sb_secret_...`. Nie wysyłaj tych sekretów e-mailem ani na czacie.

## Krok 4 — utwórz konto brokera

1. W Supabase wejdź w **Authentication → Users**.
2. Kliknij **Add user → Create new user**.
3. Utwórz konto dla brokera, np. `broker@twojafirma.pl`.
4. Skopiuj UUID utworzonego użytkownika.
5. Otwórz **SQL Editor → New query** i uruchom:

   ```sql
   update public.profiles
   set role = 'broker'
   where id = '<TUTAJ_UUID_BROKERA>';
   ```

   Zastąp wartość w nawiasach ostrych prawdziwym UUID, ale pozostaw apostrofy.

## Krok 5 — utwórz konto administratora

1. W Supabase wróć do **Authentication → Users**.
2. Kliknij **Add user → Create new user**.
3. Utwórz konto administratora, np. `administrator@twojafirma.pl`.
4. Ustaw hasło i zapisz konto.

Nie uruchamiaj dodatkowego polecenia SQL dla tego konta. Nowe konto automatycznie otrzymuje rolę `administrator`.

> Na etapie wdrożenia nie dodajemy jeszcze wspólnot. Wspólnoty przypiszemy po uruchomieniu aplikacji, w ramach konfiguracji danych operacyjnych.

## Krok 6 — sprawdź aplikację lokalnie

### Jednorazowo: zainstaluj Node.js i pnpm

Jeżeli Terminal pokazuje `command not found: pnpm`, wykonaj najpierw ten etap.

1. Otwórz stronę [nodejs.org](https://nodejs.org/en/download).
2. Pobierz wersję **LTS** dla macOS i otwórz pobrany instalator `.pkg`.
3. Przejdź przez instalator, pozostawiając domyślne ustawienia.
4. Zamknij Terminal i otwórz go ponownie (`⌘ Command + Spacja` → `Terminal`).
5. Wklej polecenie:

   ```bash
   npx get-pnpm
   ```

   Ten oficjalny instalator zapisuje pnpm w katalogu Twojego użytkownika, więc nie wymaga uprawnień administratora.

6. Po jego zakończeniu zamknij Terminal i otwórz go ponownie. Następnie sprawdź instalację:

   ```bash
   node -v
   pnpm -v
   ```

   Oba polecenia powinny zwrócić numer wersji. Jeżeli pojawi się błąd, nie wykonuj kolejnych kroków — prześlij jego treść.

> Nie używaj `sudo npm install -g pnpm`. Ten projekt nie wymaga instalowania pnpm w systemowym katalogu `/usr/local`.

### Uruchom aplikację

1. Na Macu naciśnij `⌘ Command + Spacja`, wpisz `Terminal` i naciśnij Enter.
2. W nowo otwartym oknie Terminala wklej dokładnie to polecenie i naciśnij Enter:

   ```bash
   cd "/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY ETW BROKER"
   ```

   To polecenie otwiera katalog projektu w Terminalu. Możesz sprawdzić, czy jesteś we właściwym miejscu, wpisując `pwd` — wynik powinien zawierać `SZKODY ETW BROKER`.

3. Następnie, nadal w tym samym oknie Terminala, uruchamiaj kolejno:

   ```bash
   pnpm install --frozen-lockfile
   ```

   Po jego zakończeniu:

   ```bash
   pnpm build
   ```

   A na końcu:

   ```bash
   pnpm dev
   ```

4. Gdy Terminal pokaże adres `http://localhost:3000`, otwórz go w Chrome lub Safari i zaloguj się utworzonym kontem.
5. Nie zamykaj Terminala, gdy aplikacja działa. Aby zatrzymać serwer później, wróć do Terminala i naciśnij `Ctrl + C`.

> Jeżeli Terminal wyświetli komunikat `command not found: pnpm`, zatrzymaj się na tym kroku i prześlij mi komunikat — najpierw trzeba będzie zainstalować Node.js oraz pnpm.

## Krok 7 — opublikuj kod na GitHub

GitHub służy tu do przechowywania kodu. Polecenia wpisujesz nadal w aplikacji **Terminal** na Macu, nie w przeglądarce GitHub.

1. Na GitHub utwórz nowe, puste repozytorium, np. `etw-broker-szkody`. Nie dodawaj w nim pliku README ani `.gitignore`.
2. Otwórz Terminal na Macu i przejdź do katalogu projektu:

   ```bash
   cd "/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY ETW BROKER"
   ```

3. W tym samym oknie Terminala wpisz:

   ```bash
   git add .
   git commit -m "ETW Broker claims portal"
   git branch -M main
   git remote add origin https://github.com/TWOJ-LOGIN/etw-broker-szkody.git
   git push -u origin main
   ```

4. Zastąp `TWOJ-LOGIN` swoim loginem GitHub.
5. Przy pierwszym `git push` macOS może poprosić o zalogowanie w przeglądarce do GitHub. Zaloguj się i zaakceptuj dostęp, a następnie wróć do Terminala.

## Krok 8 — opublikuj stronę na Vercel

1. Otwórz [Vercel](https://vercel.com/new).
2. Wybierz repozytorium `etw-broker-szkody` z GitHub.
3. Pozostaw ustawienie **Framework Preset: Next.js**.
4. Przed kliknięciem **Deploy** rozwiń sekcję **Environment Variables**.
5. Dodaj dwie zmienne — dla każdego wybierz środowiska **Production**, **Preview** i **Development**:

   | Nazwa | Wartość |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL z kroku 3 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key z kroku 3 |

6. Kliknij **Deploy**.
7. Po wdrożeniu Vercel poda adres, np. `https://etw-broker-szkody.vercel.app`.

## Krok 9 — dodaj adres Vercel do Supabase

1. W Supabase przejdź do **Authentication → URL Configuration**.
2. W polu **Site URL** wpisz adres z Vercel.
3. W **Redirect URLs** dodaj:

   ```text
   https://twoj-adres.vercel.app/**
   ```

4. Zapisz zmiany i wykonaj próbne logowanie na opublikowanym adresie.

## Końcowa kontrola

- administrator widzi swoją wspólnotę;
- administrator może dodać szkodę i plik;
- broker widzi zgłoszenie;
- broker może zmienić status;
- przy statusie „Przypisany numer szkody przez ubezpieczyciela” pojawia się pole na numer szkody;
- numer szkody jest widoczny w szczegółach zgłoszenia.
