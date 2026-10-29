-- Allows a broker to retain the known original reporter when entering a
-- claim that was reported before the portal was introduced.

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

  new.reported_by_name := coalesce(
    nullif(btrim(new.reported_by_name), ''),
    coalesce(nullif(btrim(reporter_name), ''), 'Administrator')
  );
  new.reported_by_email := coalesce(
    nullif(btrim(new.reported_by_email), ''),
    nullif(btrim(reporter_email), '')
  );
  return new;
end;
$$;
