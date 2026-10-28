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

Trzeba uruchomić osiem plików SQL — **jeden po drugim**.

1. W lewym menu Supabase kliknij **SQL Editor**.
2. Kliknij **New query**.
3. Otwórz pierwszy plik z projektu:

   [202610220001_initial_schema.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220001_initial_schema.sql)

4. Zaznacz całą jego zawartość, skopiuj ją do pola edytora SQL w Supabase i kliknij **Run**.
5. Poczekaj na zielony komunikat powodzenia. Dopiero wtedy utwórz kolejne **New query**.
6. W identyczny sposób uruchom następne pliki, w tej dokładnej kolejności:

   1. [202610220002_insurance_policies.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220002_insurance_policies.sql)
   2. [202610220003_insurer_claim_number_status.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220003_insurer_claim_number_status.sql)
   3. [202610220004_insurer_claim_number_field.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220004_insurer_claim_number_field.sql)
   4. [202610220005_administrator_companies.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220005_administrator_companies.sql)
   5. [202610220006_company_accounts_and_community_refresh.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220006_company_accounts_and_community_refresh.sql)
   6. [202610220007_policy_company_access.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220007_policy_company_access.sql)
   7. [202610220008_claim_conversation.sql](/Users/jakubwaszczuk/Documents/ChatGPT/SZKODY%20ETW%20BROKER/ETW-Broker-GitHub/supabase/migrations/202610220008_claim_conversation.sql)

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

> Klucz **Secret key** zaczynający się od `sb_secret_` będzie potrzebny później wyłącznie jako prywatna zmienna w Vercel o nazwie `SUPABASE_SECRET_KEY`. Nie wklejaj go do kodu, GitHub ani zmiennej zaczynającej się od `NEXT_PUBLIC_`.

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

> Każde nowe konto jest celowo tworzone jako `administrator`. Jeżeli broker po zalogowaniu widzi panel administratora, to znaczy, że ten krok został pominięty albo wykonany dla innego UUID. Możesz też nadać rolę po adresie e-mail:

```sql
update public.profiles
set role = 'broker'
where id = (
  select id
  from auth.users
  where lower(email) = lower('adres-brokera@twojafirma.pl')
);
```

Po wykonaniu zapytania wyloguj brokera z aplikacji i zaloguj go ponownie.

## Krok 5 — utwórz konto administratora

1. W Supabase wróć do **Authentication → Users**.
2. Kliknij **Add user → Create new user**.
3. Utwórz konto administratora, np. `administrator@twojafirma.pl`.
4. Ustaw hasło i zapisz konto.

Nie uruchamiaj dodatkowego polecenia SQL dla tego konta. Nowe konto automatycznie otrzymuje rolę `administrator`. Po uruchomieniu migracji `006` kolejne konta twórz wygodnie w panelu brokera: najpierw dodaj firmę w **Obsługiwani Administratorzy → Dodaj lub edytuj firmę**, a następnie utwórz dla niej dowolną liczbę kont.

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
3. W polu **Application Preset** wybierz **Next.js**. W starszej wersji panelu to samo pole nosiło nazwę **Framework Preset**.
4. Przed kliknięciem **Deploy** rozwiń sekcję **Environment Variables**.
5. Dodaj trzy zmienne — dla każdego wybierz środowiska **Production**, **Preview** i **Development**:

   | Nazwa | Wartość |
   | --- | --- |
   | `NEXT_PUBLIC_SUPABASE_URL` | Project URL z kroku 3 |
   | `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY` | Publishable key z kroku 3 |
   | `SUPABASE_SECRET_KEY` | Secret key (`sb_secret_...`) z Supabase — prywatna zmienna serwera |

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

## Krok 10 — podłącz domenę `wspolnoty.etwbroker.pl`

1. Po udanym wdrożeniu otwórz projekt w Vercel.
2. Wejdź w **Settings → Domains**.
3. Wybierz **Add Domain**, wpisz dokładnie `wspolnoty.etwbroker.pl` i przypisz ją do środowiska Production.
4. Vercel pokaże wymagany rekord DNS. Dla subdomeny będzie to rekord typu **CNAME**. Skopiuj jego wartość dokładnie tak, jak pokazuje Vercel.
5. Otwórz panel firmy, w której zarządzana jest domena `etwbroker.pl` (np. Cloudflare, rejestrator domeny lub hosting) i dodaj rekord:

   | Pole w panelu DNS | Wartość |
   | --- | --- |
   | Typ | `CNAME` |
   | Nazwa / Host | `wspolnoty` |
   | Cel / Value / Points to | dokładna wartość pokazana przez Vercel |
   | TTL | domyślne ustawienie |

6. Jeżeli istnieje już rekord DNS o nazwie `wspolnoty`, usuń wyłącznie ten konfliktujący rekord przed dodaniem CNAME. Nie usuwaj rekordów głównej domeny, poczty ani innych subdomen.
7. Wróć do Vercel i poczekaj na status **Valid Configuration**. Certyfikat HTTPS zostanie wygenerowany automatycznie.
8. W Supabase uzupełnij **Authentication → URL Configuration**:

   - **Site URL:** `https://wspolnoty.etwbroker.pl`
   - **Redirect URLs:** `https://wspolnoty.etwbroker.pl/**`

> Zmiany DNS mogą być widoczne po kilku minutach, a w niektórych przypadkach do 24 godzin.

## Końcowa kontrola

- administrator widzi swoją wspólnotę;
- administrator może dodać szkodę i plik;
- broker widzi zgłoszenie;
- broker może zmienić status;
- przy statusie „Przypisany numer szkody przez ubezpieczyciela” pojawia się pole na numer szkody;
- numer szkody jest widoczny w szczegółach zgłoszenia.
