-- Stores a readable snapshot of the person who submitted each claim.
-- Run after migration 009.

alter table public.claims
  add column if not exists reported_by_name text,
  add column if not exists reported_by_email text;

create or replace function public.set_claim_reporter()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  reporter_name text;
  reporter_email text;
begin
  select full_name, email
  into reporter_name, reporter_email
  from public.profiles
  where id = new.created_by;

  new.reported_by_name := coalesce(nullif(btrim(reporter_name), ''), 'Administrator');
  new.reported_by_email := nullif(btrim(reporter_email), '');
  return new;
end;
$$;

drop trigger if exists before_claim_insert_set_reporter on public.claims;
create trigger before_claim_insert_set_reporter
  before insert on public.claims
  for each row execute procedure public.set_claim_reporter();

-- Fill the data for claims created before this migration.
update public.claims claim
set
  reported_by_name = coalesce(nullif(btrim(profile.full_name), ''), 'Administrator'),
  reported_by_email = nullif(btrim(profile.email), '')
from public.profiles profile
where profile.id = claim.created_by
  and (claim.reported_by_name is null or claim.reported_by_email is null);
