-- Companies own communities. Individual administrator accounts are members of a company.
-- Run after migrations 001–004.

create table if not exists public.administrator_companies (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  nip text,
  created_at timestamptz not null default now()
);

alter table public.profiles
  add column if not exists administrator_company_id uuid references public.administrator_companies(id) on delete set null;

alter table public.communities
  add column if not exists administrator_company_id uuid references public.administrator_companies(id) on delete set null;

-- The former individual assignment becomes optional. Existing records are migrated below.
alter table public.communities
  alter column administrator_id drop not null;

create index if not exists profiles_administrator_company_id_idx on public.profiles(administrator_company_id);
create index if not exists communities_administrator_company_id_idx on public.communities(administrator_company_id);

-- Preserve access to existing data: each legacy account receives a temporary company.
insert into public.administrator_companies (name)
select concat(
  'Firma administratora: ',
  coalesce(nullif(btrim(p.full_name), ''), 'konto'),
  ' [', left(p.id::text, 8), ']'
)
from public.profiles p
where p.role = 'administrator'
  and p.administrator_company_id is null
on conflict (name) do nothing;

update public.profiles p
set administrator_company_id = company.id
from public.administrator_companies company
where p.role = 'administrator'
  and p.administrator_company_id is null
  and company.name = concat(
    'Firma administratora: ',
    coalesce(nullif(btrim(p.full_name), ''), 'konto'),
    ' [', left(p.id::text, 8), ']'
  );

update public.communities c
set administrator_company_id = p.administrator_company_id
from public.profiles p
where p.id = c.administrator_id
  and c.administrator_company_id is null;

create or replace function public.current_administrator_company_id()
returns uuid language sql stable security definer set search_path = public as $$
  select administrator_company_id
  from public.profiles
  where id = auth.uid();
$$;

-- An administrator may update their own display data, but cannot move themselves to another company.
create or replace function public.prevent_client_profile_access_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and (
    old.role is distinct from new.role
    or old.administrator_company_id is distinct from new.administrator_company_id
  ) then
    raise exception 'Rola i firma administrująca mogą być zmienione wyłącznie przez brokera.';
  end if;
  return new;
end;
$$;

drop trigger if exists before_profile_role_update on public.profiles;
create trigger before_profile_access_update
  before update of role, administrator_company_id on public.profiles
  for each row execute procedure public.prevent_client_profile_access_change();

alter table public.administrator_companies enable row level security;

create policy "company: broker or member can read" on public.administrator_companies
  for select using (public.is_broker() or id = public.current_administrator_company_id());
create policy "company: broker can create" on public.administrator_companies
  for insert with check (public.is_broker());
create policy "company: broker can update" on public.administrator_companies
  for update using (public.is_broker()) with check (public.is_broker());
create policy "company: broker can delete" on public.administrator_companies
  for delete using (public.is_broker());

drop policy if exists "community: administrator or broker can read" on public.communities;
create policy "community: company administrator or broker can read" on public.communities
  for select using (
    public.is_broker()
    or administrator_company_id = public.current_administrator_company_id()
  );

drop policy if exists "claim: owner community or broker can read" on public.claims;
drop policy if exists "claim: administrator can create for own community" on public.claims;
create policy "claim: company administrator or broker can read" on public.claims
  for select using (
    public.is_broker() or exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.administrator_company_id = public.current_administrator_company_id()
    )
  );
create policy "claim: company administrator can create" on public.claims
  for insert with check (
    created_by = auth.uid() and exists (
      select 1 from public.communities c
      where c.id = community_id
        and c.administrator_company_id = public.current_administrator_company_id()
    )
  );
