-- Keeps the dashboard notification state on each claim.
-- Run after migration 008 (claim conversation).

alter table public.claims
  add column if not exists last_message_at timestamptz,
  add column if not exists last_message_sender_role public.user_role;

create index if not exists claims_last_message_at_idx
  on public.claims (last_message_at desc)
  where last_message_at is not null;

create or replace function public.update_claim_last_message()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.claims
  set
    last_message_at = new.created_at,
    last_message_sender_role = new.sender_role
  where id = new.claim_id
    and (last_message_at is null or new.created_at >= last_message_at);

  return new;
end;
$$;

drop trigger if exists after_claim_message_insert on public.claim_messages;
create trigger after_claim_message_insert
  after insert on public.claim_messages
  for each row execute procedure public.update_claim_last_message();

-- Fill in the notification state for conversations that already exist.
with latest_message as (
  select distinct on (claim_id)
    claim_id,
    created_at,
    sender_role
  from public.claim_messages
  order by claim_id, created_at desc, id desc
)
update public.claims claim
set
  last_message_at = latest_message.created_at,
  last_message_sender_role = latest_message.sender_role
from latest_message
where claim.id = latest_message.claim_id;
