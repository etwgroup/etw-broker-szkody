# Szablon wiadomości dla nowych administratorów

Plik `ETW-Broker-Centrum-Obslugi-Szkod.html` jest przeznaczony dla nowego Outlooka. Plik `ETW-Broker-Centrum-Obslugi-Szkod-Outlook-Klasyczny.html` jest wersją zalecaną dla klasycznego Outlooka dla Windows.

Wersja klasyczna jest wyrównana do lewej, nie zawiera ciemnego tła ani graficznej stopki. Ma wyłącznie logo ETW Broker w nagłówku, a tekst pozostaje czytelny w klasycznym Outlooku.

## Utworzenie szablonu w Outlooku dla Windows

1. W klasycznym Outlooku wybierz konto, z którego ma być wysyłana wiadomość, a następnie utwórz zwykłą **Nową wiadomość**. Nie otwieraj pliku EML - blokuje on wybór nadawcy.
2. Otwórz plik HTML w przeglądarce Chrome lub Edge.
3. Naciśnij `Ctrl + A`, a następnie `Ctrl + C`.
4. Wróć do utworzonej wiadomości w Outlooku, kliknij w jej treści i wklej przez `Ctrl + V`.
5. Uzupełnij temat:

   `Nowość dla zarządców wspólnot — Centrum Obsługi Szkód ETW Broker`

6. Nie dołączaj PDF jako pliku. Odbiorca pobierze informację o platformie oraz dokumenty współpracy przez odnośniki w treści wiadomości.
7. Nie wpisuj odbiorców do szablonu. Po zapisaniu dobierzesz ich indywidualnie do każdej wiadomości.

### Nowy Outlook dla Windows

Po przygotowaniu wiadomości wybierz **Wiadomość → Szablon wiadomości → Zapisz wiadomość jako szablon**. Outlook zachowa temat, układ i oba odnośniki.

### Klasyczny Outlook dla Windows

Wybierz **Plik → Zapisz jako**, a następnie typ: **Szablon programu Outlook (*.oft)**. Nadaj nazwę `ETW Broker — prezentacja dla administratorów`.

Przy kolejnej wysyłce otwórz: **Nowe elementy → Więcej elementów → Wybierz formularz → Szablony użytkownika w systemie plików**.

Gdy szablon zostanie otwarty, kliknij pole **Od** i wybierz właściwe konto z listy. Jeśli pola **Od** nie widać, w zwykłej wiadomości wybierz **Opcje → Od**. Nie wpisuj adresu nadawcy ręcznie.

## Ważne

- Film jest umieszczony jako przycisk prowadzący do YouTube: `https://www.youtube.com/watch?v=onbzIZ5c_W8`.
- Logo i stopka kontaktowa pobierają się z publicznego adresu ETW Broker. Jeżeli Outlook nie pokaże grafiki w podglądzie, odbiorca może wybrać „Pobierz obrazy”.
- Informacyjny PDF dla potencjalnych klientów jest dostępny pod adresem `https://wspolnoty.etwbroker.pl/materialy/ETW-Broker-informacja-dla-zarzadcow.pdf`.
- Wiadomość zawiera również odnośniki do pełnomocnictwa brokerskiego i formularza zgody na przetwarzanie danych. Oba dokumenty należy wypełnić, podpisać przez osoby uprawnione do reprezentacji zarządu wspólnoty, a następnie przesłać na adres `jwaszczuk@etwbroker.pl`.
- Przed pierwszą wysyłką wgraj do repozytorium, z zachowaniem dokładnych ścieżek, pliki `public/materialy/ETW-Broker-pelnomocnictwo-brokerskie.pdf` oraz `public/materialy/ETW-Broker-formularz-zgody-na-przetwarzanie-danych.pdf`. Po wdrożeniu Vercel otwórz oba odnośniki z wiadomości i potwierdź, że pliki się pobierają.
- Wgraj również plik `public/email/etw-broker-stopka.png`. Po wdrożeniu będzie dostępny pod adresem `https://wspolnoty.etwbroker.pl/email/etw-broker-stopka.png`.
