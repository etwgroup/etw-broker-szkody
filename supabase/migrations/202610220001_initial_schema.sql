-- ETW Broker: core data model, access rules and private claim documents.
-- Run this migration in Supabase SQL Editor or with the Supabase CLI.

create extension if not exists pgcrypto;

create type public.user_role as enum ('administrator', 'broker');
create type public.claim_status as enum ('new', 'received', 'submitted_to_insurer', 'rejected', 'accepted', 'paid');

create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  role public.user_role not null default 'administrator',
  created_at timestamptz not null default now()
);

create table public.communities (
  id uuid primary key default gen_random_uuid(),
  administrator_id uuid not null references public.profiles(id) on delete restrict,
  name text not null,
  address text not null,
  nip text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create sequence public.claim_reference_sequence start 1001;

create table public.claims (
  id uuid primary key default gen_random_uuid(),
  reference text not null unique,
  community_id uuid not null references public.communities(id) on delete restrict,
  created_by uuid not null references public.profiles(id) on delete restrict,
  title text not null check (char_length(title) between 3 and 140),
  description text not null check (char_length(description) between 10 and 5000),
  occurred_at date not null,
  status public.claim_status not null default 'new',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.claim_attachments (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes <= 20971520),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create table public.claim_status_history (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  status public.claim_status not null,
  note text check (note is null or char_length(note) <= 2000),
  changed_by uuid references public.profiles(id) on delete set null,
  created_at timestamptz not null default now()
);

create index communities_administrator_id_idx on public.communities(administrator_id);
create index claims_community_id_idx on public.claims(community_id);
create index claims_status_idx on public.claims(status);
create index claims_created_at_idx on public.claims(created_at desc);
create index claim_attachments_claim_id_idx on public.claim_attachments(claim_id);
create index claim_status_history_claim_id_idx on public.claim_status_history(claim_id, created_at desc);

-- A new account is always an administrator; broker access is granted only by a project owner in SQL Editor.
create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)));
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.create_profile_for_new_user();

create or replace function public.set_claim_reference()
returns trigger language plpgsql set search_path = public as $$
begin
  if new.reference is null or new.reference = '' then
    new.reference := 'ETW-' || to_char(current_date, 'YYYY') || '-' || lpad(nextval('public.claim_reference_sequence')::text, 5, '0');
  end if;
  return new;
end;
$$;

create trigger before_claim_insert
  before insert on public.claims
  for each row execute procedure public.set_claim_reference();

create or replace function public.update_claim_timestamp()
returns trigger language plpgsql set search_path = public as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger before_claim_update
  before update on public.claims
  for each row execute procedure public.update_claim_timestamp();

create or replace function public.create_claim_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.claim_status_history (claim_id, status, changed_by)
    values (new.id, new.status, new.created_by);
  elsif old.status is distinct from new.status then
    insert into public.claim_status_history (claim_id, status, changed_by)
    values (new.id, new.status, auth.uid());
  end if;
  return new;
end;
$$;

create trigger after_claim_write_history
  after insert or update of status on public.claims
  for each row execute procedure public.create_claim_history();

-- Broker check is security-definer to keep RLS policies simple and non-recursive.
create or replace function public.is_broker()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'broker');
$$;

create or replace function public.prevent_client_role_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if old.role is distinct from new.role and auth.uid() is not null then
    raise exception 'Rola użytkownika może zostać zmieniona wyłącznie przez właściciela projektu.';
  end if;
  return new;
end;
$$;

create trigger before_profile_role_update
  before update of role on public.profiles
  for each row execute procedure public.prevent_client_role_change();

alter table public.profiles enable row level security;
alter table public.communities enable row level security;
alter table public.claims enable row level security;
alter table public.claim_attachments enable row level security;
alter table public.claim_status_history enable row level security;

create policy "profile: own or broker can read" on public.profiles for select using (id = auth.uid() or public.is_broker());
create policy "profile: user can update own details" on public.profiles for update using (id = auth.uid()) with check (id = auth.uid());

create policy "community: administrator or broker can read" on public.communities for select using (administrator_id = auth.uid() or public.is_broker());
create policy "community: broker can create" on public.communities for insert with check (public.is_broker());
create policy "community: broker can update" on public.communities for update using (public.is_broker()) with check (public.is_broker());
create policy "community: broker can delete" on public.communities for delete using (public.is_broker());

create policy "claim: owner community or broker can read" on public.claims for select using (
  public.is_broker() or exists (select 1 from public.communities c where c.id = community_id and c.administrator_id = auth.uid())
);
create policy "claim: administrator can create for own community" on public.claims for insert with check (
  created_by = auth.uid() and exists (select 1 from public.communities c where c.id = community_id and c.administrator_id = auth.uid())
);
create policy "claim: broker can update" on public.claims for update using (public.is_broker()) with check (public.is_broker());

create policy "attachment: related claim reader can read" on public.claim_attachments for select using (
  exists (select 1 from public.claims c where c.id = claim_id)
);
create policy "attachment: claim author can add" on public.claim_attachments for insert with check (
  uploaded_by = auth.uid() and exists (select 1 from public.claims c where c.id = claim_id and c.created_by = auth.uid())
);

create policy "history: related claim reader can read" on public.claim_status_history for select using (
  exists (select 1 from public.claims c where c.id = claim_id)
);

-- Private documents: direct browser upload/download is allowed only through the corresponding claim's access rules.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('claim-attachments', 'claim-attachments', false, 20971520,
  array['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'])
on conflict (id) do nothing;

create policy "storage: claim reader can download" on storage.objects for select using (
  bucket_id = 'claim-attachments' and exists (
    select 1 from public.claim_attachments a where a.storage_path = name
  )
);
create policy "storage: claim author can upload" on storage.objects for insert with check (
  bucket_id = 'claim-attachments' and exists (
    select 1 from public.claims c
    where c.id::text = (storage.foldername(name))[1] and c.created_by = auth.uid()
  )
);

-- After creating a user in Authentication, run this once in SQL Editor for broker accounts:
-- update public.profiles set role = 'broker' where id = '<auth user UUID>';
