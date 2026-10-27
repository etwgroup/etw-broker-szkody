-- Company-only creation, editable administrator accounts and refreshable community register data.
-- Run after migrations 001–005.

alter table public.profiles
  add column if not exists email text;

alter table public.communities
  add column if not exists regon text;

-- Keep an email copy for the broker's administrator-account directory.
update public.profiles p
set email = u.email
from auth.users u
where u.id = p.id
  and p.email is distinct from u.email;

create unique index if not exists profiles_email_unique_idx
  on public.profiles (lower(email))
  where email is not null;

create or replace function public.create_profile_for_new_user()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email)
  values (
    new.id,
    coalesce(new.raw_user_meta_data->>'full_name', split_part(new.email, '@', 1)),
    new.email
  );
  return new;
end;
$$;

create or replace function public.prevent_client_profile_access_change()
returns trigger language plpgsql set search_path = public as $$
begin
  if auth.uid() is not null and (
    old.role is distinct from new.role
    or old.administrator_company_id is distinct from new.administrator_company_id
    or old.email is distinct from new.email
  ) then
    raise exception 'Rola, firma administrująca i e-mail mogą być zmienione wyłącznie przez brokera.';
  end if;
  return new;
end;
$$;

drop trigger if exists before_profile_access_update on public.profiles;
create trigger before_profile_access_update
  before update of role, administrator_company_id, email on public.profiles
  for each row execute procedure public.prevent_client_profile_access_change();

-- The register is the source of names, addresses, NIP and REGON.
-- Import never changes a manual company assignment.
create or replace function public.import_communities_from_register(payload jsonb)
returns table(inserted_count integer, updated_count integer)
language plpgsql security definer set search_path = public as $$
declare
  item jsonb;
  existing_id uuid;
  inserted_total integer := 0;
  updated_total integer := 0;
  item_name text;
  item_address text;
  item_nip text;
  item_regon text;
begin
  if not public.is_broker() then
    raise exception 'Tylko broker może importować wspólnoty.';
  end if;

  for item in select value from jsonb_array_elements(payload)
  loop
    item_name := nullif(btrim(item->>'name'), '');
    item_address := nullif(btrim(item->>'address'), '');
    item_nip := nullif(regexp_replace(coalesce(item->>'nip', ''), '\D', '', 'g'), '');
    item_regon := nullif(regexp_replace(coalesce(item->>'regon', ''), '\D', '', 'g'), '');
    existing_id := null;

    if item_name is null or item_address is null then
      continue;
    end if;

    if item_nip is not null then
      select id into existing_id
      from public.communities
      where regexp_replace(coalesce(nip, ''), '\D', '', 'g') = item_nip
      order by updated_at desc
      limit 1;
    end if;

    if existing_id is null then
      select id into existing_id
      from public.communities
      where lower(btrim(name)) = lower(item_name)
        and lower(btrim(address)) = lower(item_address)
      order by updated_at desc
      limit 1;
    end if;

    if existing_id is null then
      insert into public.communities (name, address, nip, regon)
      values (item_name, item_address, item_nip, item_regon);
      inserted_total := inserted_total + 1;
    else
      update public.communities
      set name = item_name,
          address = item_address,
          nip = item_nip,
          regon = item_regon,
          updated_at = now()
      where id = existing_id;
      updated_total := updated_total + 1;
    end if;
  end loop;

  return query select inserted_total, updated_total;
end;
$$;
