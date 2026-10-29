-- JEDNORAZOWE CZYSZCZENIE SZKÓD TESTOWYCH
-- Uruchom WYŁĄCZNIE w Supabase SQL Editor po potwierdzeniu,
-- że wszystkie obecne szkody można trwale usunąć.
--
-- Usuwa: szkody, statusy, rozmowy, notatki wewnętrzne, powiadomienia
-- oraz ich wpisy w bazie danych.
--
-- Pliki załączników trzeba następnie usunąć w Supabase Storage. Platforma
-- celowo nie pozwala usuwać plików Storage zwykłym poleceniem SQL.
-- Pozostawia: konta, firmy administrujące, wspólnoty i polisy.

begin;

do $$
declare
  claim_count integer;
begin
  select count(*) into claim_count from public.claims;
  raise notice 'Trwale usuwam % szkód.', claim_count;
end;
$$;

-- Klucze obce usuną powiązane statusy, rozmowy, notatki i powiadomienia.
delete from public.claims;

commit;

-- Po wykonaniu poniższe zapytanie powinno zwrócić 0:
-- select count(*) as pozostale_szkody from public.claims;

-- Następnie w Supabase Storage usuń wszystkie pliki z bucketów:
-- 1. claim-attachments
-- 2. claim-message-attachments
