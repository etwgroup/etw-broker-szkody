export type LegalSection = {
  title: string;
  paragraphs?: string[];
  items?: string[];
};

export type LegalDocument = {
  slug: "privacy" | "cookies" | "terms" | "broker" | "complaints";
  label: string;
  title: string;
  lead: string;
  updatedAt: string;
  sections: LegalSection[];
};

const operator = "ETW BROKER Jessica Klimiuk-Waszczuk, ul. Hugo Kołłątaja 13 lok. 33, 15-774 Białystok, NIP 5423250008, REGON 362974061";

export const legalDocuments: LegalDocument[] = [
  {
    slug: "privacy",
    label: "Polityka prywatności",
    title: "Polityka prywatności",
    lead: "Informacja o przetwarzaniu danych osobowych w Centrum obsługi szkód ETW Broker.",
    updatedAt: "29 października 2026 r.",
    sections: [
      {
        title: "1. Administrator danych",
        paragraphs: [
          `Administratorem danych osobowych jest ${operator}.`,
          "Dane są przetwarzane w związku z prowadzeniem platformy zgłaszania i obsługi szkód dla wspólnot mieszkaniowych oraz realizacją usług brokerskich. W sprawach dotyczących danych osobowych można skontaktować się z Administratorem korespondencyjnie pod wskazanym adresem siedziby.",
        ],
      },
      {
        title: "2. Zakres, cele i podstawy przetwarzania",
        paragraphs: ["W zależności od sposobu korzystania z platformy możemy przetwarzać dane identyfikacyjne i kontaktowe użytkownika, dane jego firmy, dane zawarte w zgłoszeniu szkody, wiadomościach oraz załącznikach, a także dane techniczne potrzebne do bezpiecznego zalogowania."],
        items: [
          "utworzenie i obsługa konta użytkownika oraz zapewnienie bezpieczeństwa dostępu — art. 6 ust. 1 lit. b i f RODO;",
          "przyjęcie, prowadzenie i dokumentowanie zgłoszenia szkody — art. 6 ust. 1 lit. b i f RODO;",
          "komunikacja dotycząca sprawy, w tym powiadomienia w systemie i e-mail — art. 6 ust. 1 lit. f RODO;",
          "realizacja obowiązków prawnych, ustalenie, dochodzenie lub obrona roszczeń — art. 6 ust. 1 lit. c i f RODO.",
        ],
      },
      {
        title: "3. Odbiorcy i okres przechowywania",
        paragraphs: [
          "Dostęp do danych mają wyłącznie upoważnione osoby po stronie ETW Broker, użytkownicy właściwej firmy administrującej oraz podmioty wspierające obsługę techniczną platformy, działające na podstawie odpowiednich umów. Dane mogą być przekazywane także ubezpieczycielowi lub innemu podmiotowi uczestniczącemu w obsłudze sprawy, jeżeli jest to konieczne.",
          "Dane przechowujemy przez okres korzystania z konta i obsługi sprawy, a po jego zakończeniu przez czas potrzebny do wykonania obowiązków prawnych oraz zabezpieczenia ewentualnych roszczeń.",
        ],
      },
      {
        title: "4. Twoje prawa",
        paragraphs: ["Osobie, której dane dotyczą, przysługuje prawo dostępu do danych, ich sprostowania, usunięcia lub ograniczenia przetwarzania, przenoszenia danych, wniesienia sprzeciwu oraz wniesienia skargi do Prezesa Urzędu Ochrony Danych Osobowych. Podanie danych wymaganych do utworzenia konta i obsługi szkody jest konieczne do korzystania z platformy."],
      },
    ],
  },
  {
    slug: "cookies",
    label: "Polityka cookies",
    title: "Polityka cookies",
    lead: "Informacja o technicznych plikach i danych używanych do bezpiecznego działania platformy.",
    updatedAt: "29 października 2026 r.",
    sections: [
      {
        title: "1. Niezbędne dane techniczne",
        paragraphs: ["Platforma używa wyłącznie mechanizmów koniecznych do jej działania, w szczególności danych uwierzytelniających sesję i ustawień zabezpieczeń. Pozwalają one utrzymać zalogowanie, chronić konto i zapewnić poprawne działanie formularzy."],
      },
      {
        title: "2. Analityka i marketing",
        paragraphs: ["W aktualnej wersji platformy nie wykorzystujemy opcjonalnych plików cookies do celów marketingowych ani do profilowania użytkowników. Jeżeli w przyszłości zostaną dodane narzędzia analityczne lub marketingowe, przed ich uruchomieniem pojawi się mechanizm pozwalający wyrazić albo odmówić zgody."],
      },
      {
        title: "3. Zarządzanie ustawieniami",
        paragraphs: ["Użytkownik może usunąć lub ograniczyć pliki cookies w ustawieniach swojej przeglądarki. Wyłączenie mechanizmów niezbędnych może jednak uniemożliwić zalogowanie lub prawidłowe korzystanie z panelu."],
      },
    ],
  },
  {
    slug: "terms",
    label: "Regulamin platformy",
    title: "Regulamin Centrum obsługi szkód",
    lead: "Zasady korzystania z elektronicznej platformy ETW Broker.",
    updatedAt: "29 października 2026 r.",
    sections: [
      {
        title: "1. Usługodawca i zakres usługi",
        paragraphs: [`Usługodawcą jest ${operator}. Platforma umożliwia uprawnionym użytkownikom zgłaszanie szkód dotyczących przypisanych wspólnot, przekazywanie dokumentów, śledzenie statusów i wymianę wiadomości ze stroną brokerską.`],
      },
      {
        title: "2. Dostęp do konta",
        paragraphs: ["Konto administratora zakłada broker na podstawie imienia, nazwiska i adresu e-mail użytkownika. Użytkownik samodzielnie ustanawia hasło i powinien zachować je w poufności. Zabronione jest udostępnianie konta innym osobom."],
      },
      {
        title: "3. Zasady korzystania",
        items: [
          "wprowadzaj dane rzetelne, aktualne i związane z obsługiwaną wspólnotą;",
          "załączaj wyłącznie dokumenty, które możesz legalnie udostępnić;",
          "nie wprowadzaj treści bezprawnych, złośliwego oprogramowania ani danych niepotrzebnych do obsługi szkody;",
          "niezwłocznie zgłoś brokerowi podejrzenie utraty dostępu do konta.",
        ],
      },
      {
        title: "4. Wymagania techniczne i reklamacje",
        paragraphs: ["Do korzystania z platformy potrzebne są urządzenie z dostępem do Internetu, aktualna przeglądarka internetowa oraz aktywny adres e-mail. Reklamacje dotyczące funkcjonowania platformy można złożyć zgodnie z zasadami opisanymi w zakładce Reklamacje."],
      },
    ],
  },
  {
    slug: "broker",
    label: "Informacje o brokerze",
    title: "Informacje o brokerze",
    lead: "Podstawowe dane podmiotu prowadzącego Centrum obsługi szkód.",
    updatedAt: "29 października 2026 r.",
    sections: [
      {
        title: "1. Dane identyfikacyjne",
        paragraphs: [`Działalność brokerską prowadzi ${operator}.`],
      },
      {
        title: "2. Rejestr brokerów ubezpieczeniowych",
        paragraphs: ["Informację o wpisie brokera do rejestru brokerów ubezpieczeniowych prowadzonego przez Komisję Nadzoru Finansowego można sprawdzić w publicznym Rejestrze Pośredników Ubezpieczeniowych i Reasekuracyjnych KNF."],
      },
      {
        title: "3. Charakter platformy",
        paragraphs: ["Centrum obsługi szkód jest narzędziem komunikacji i dokumentowania spraw. Nie zastępuje postanowień umowy brokerskiej, umowy ubezpieczenia ani decyzji ubezpieczyciela."],
      },
    ],
  },
  {
    slug: "complaints",
    label: "Reklamacje",
    title: "Reklamacje i skargi",
    lead: "Jak zgłosić reklamację dotyczącą obsługi lub działania platformy.",
    updatedAt: "29 października 2026 r.",
    sections: [
      {
        title: "1. Jak złożyć reklamację",
        paragraphs: [`Reklamację można złożyć pisemnie na adres: ${operator}. W treści warto podać dane kontaktowe, numer szkody lub opis sprawy, datę zdarzenia oraz oczekiwany sposób rozwiązania problemu.`],
      },
      {
        title: "2. Rozpatrzenie reklamacji",
        paragraphs: ["Reklamacja zostanie przeanalizowana bez zbędnej zwłoki. Odpowiedź zostanie przekazana na dane kontaktowe podane w zgłoszeniu. W sprawach dotyczących decyzji ubezpieczyciela mogą obowiązywać odrębne tryby reklamacyjne u danego ubezpieczyciela."],
      },
      {
        title: "3. Pomoc i ochrona praw",
        paragraphs: ["Jeżeli reklamacja dotyczy przetwarzania danych osobowych, można także skorzystać z praw wskazanych w Polityce prywatności, w tym wnieść skargę do Prezesa Urzędu Ochrony Danych Osobowych."],
      },
    ],
  },
];

export const legalDocumentsBySlug = Object.fromEntries(legalDocuments.map((document) => [document.slug, document])) as Record<LegalDocument["slug"], LegalDocument>;

