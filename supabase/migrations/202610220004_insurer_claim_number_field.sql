-- Store the number assigned by the insurer and record it in the audit trail.
-- Run after 202610220003_insurer_claim_number_status.sql.

alter table public.claims
  add column if not exists insurer_claim_number text;

do $$
begin
  alter table public.claims
    add constraint insurer_claim_number_required_for_assigned_status
    check (
      status <> 'insurer_claim_number_assigned'
      or insurer_claim_number is not null and char_length(trim(insurer_claim_number)) > 0
    );
exception when duplicate_object then null;
end;
$$;

create or replace function public.create_claim_history()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if tg_op = 'INSERT' then
    insert into public.claim_status_history (claim_id, status, changed_by)
    values (new.id, new.status, new.created_by);
  elsif old.status is distinct from new.status then
    insert into public.claim_status_history (claim_id, status, note, changed_by)
    values (
      new.id,
      new.status,
      case when new.status = 'insurer_claim_number_assigned'
        then 'Numer szkody ubezpieczyciela: ' || new.insurer_claim_number || '.'
      end,
      auth.uid()
    );
  elsif new.status = 'insurer_claim_number_assigned'
    and old.insurer_claim_number is distinct from new.insurer_claim_number then
    insert into public.claim_status_history (claim_id, status, note, changed_by)
    values (
      new.id,
      new.status,
      'Zaktualizowano numer szkody ubezpieczyciela: ' || new.insurer_claim_number || '.',
      auth.uid()
    );
  end if;
  return new;
end;
$$;

drop trigger if exists after_claim_write_history on public.claims;
create trigger after_claim_write_history
  after insert or update of status, insurer_claim_number on public.claims
  for each row execute procedure public.create_claim_history();
