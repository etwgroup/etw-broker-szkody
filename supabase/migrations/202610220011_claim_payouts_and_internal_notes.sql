-- Payout amount, yearly loss reporting and broker-only internal notes.
-- Run after migrations 001–010.

alter table public.claims
  add column if not exists paid_amount numeric(12, 2),
  add column if not exists paid_at date;

alter table public.claims
  add constraint claims_paid_amount_positive_check
  check (paid_amount is null or paid_amount > 0);

create index claims_paid_at_idx on public.claims (paid_at)
  where paid_at is not null;

create or replace function public.set_claim_payout_details()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' then
    if new.paid_amount is null or new.paid_amount <= 0 then
      raise exception 'Przy statusie „Wypłacona” podaj kwotę wypłaty większą od zera.';
    end if;

    if new.paid_at is null then
      new.paid_at := current_date;
    end if;
  end if;

  return new;
end;
$$;

drop trigger if exists before_claim_status_set_payout on public.claims;
create trigger before_claim_status_set_payout
  before insert or update of status, paid_amount on public.claims
  for each row execute procedure public.set_claim_payout_details();

create table public.claim_internal_notes (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  created_by uuid not null references public.profiles(id) on delete restrict,
  author_name text not null,
  body text not null check (char_length(btrim(body)) between 1 and 4000),
  created_at timestamptz not null default now()
);

create index claim_internal_notes_claim_id_created_at_idx
  on public.claim_internal_notes (claim_id, created_at desc);

create or replace function public.set_claim_internal_note_author()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  broker_name text;
begin
  if auth.uid() is null or not public.is_broker() then
    raise exception 'Notatki wewnętrzne są dostępne wyłącznie dla brokera.';
  end if;

  select full_name into broker_name
  from public.profiles
  where id = auth.uid();

  new.created_by := auth.uid();
  new.author_name := coalesce(nullif(btrim(broker_name), ''), 'Broker ETW');
  new.body := btrim(new.body);
  return new;
end;
$$;

create trigger before_claim_internal_note_insert
  before insert on public.claim_internal_notes
  for each row execute procedure public.set_claim_internal_note_author();

alter table public.claim_internal_notes enable row level security;

create policy "internal note: broker can read" on public.claim_internal_notes
  for select using (public.is_broker());
create policy "internal note: broker can add" on public.claim_internal_notes
  for insert with check (public.is_broker() and created_by = auth.uid());
