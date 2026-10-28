-- In-app notifications for brokers and administrator accounts. No e-mail delivery.
-- Run after migrations 001–011.

create table public.notifications (
  id uuid primary key default gen_random_uuid(),
  recipient_id uuid not null references public.profiles(id) on delete cascade,
  notification_type text not null check (notification_type in ('claim_created', 'claim_message', 'claim_status_changed')),
  claim_id uuid references public.claims(id) on delete cascade,
  title text not null,
  body text not null,
  created_at timestamptz not null default now(),
  read_at timestamptz
);

create index notifications_recipient_unread_idx
  on public.notifications (recipient_id, created_at desc)
  where read_at is null;
create index notifications_recipient_created_idx
  on public.notifications (recipient_id, created_at desc);

alter table public.notifications enable row level security;

create policy "notification: recipient can read" on public.notifications
  for select using (recipient_id = auth.uid());
create policy "notification: recipient can mark as read" on public.notifications
  for update using (recipient_id = auth.uid()) with check (recipient_id = auth.uid());

revoke update on public.notifications from anon, authenticated;
grant update (read_at) on public.notifications to authenticated;

create or replace function public.notify_brokers_about_new_claim()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  insert into public.notifications (recipient_id, notification_type, claim_id, title, body)
  select
    profile.id,
    'claim_created',
    new.id,
    'Nowe zgłoszenie szkody',
    concat('Szkoda ', new.reference, ': ', new.title)
  from public.profiles profile
  where profile.role = 'broker';
  return new;
end;
$$;

drop trigger if exists after_claim_insert_notify_brokers on public.claims;
create trigger after_claim_insert_notify_brokers
  after insert on public.claims
  for each row execute procedure public.notify_brokers_about_new_claim();

create or replace function public.notify_claim_message_recipient()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  company_id uuid;
  claim_reference text;
  claim_title text;
  recipient_title text;
  recipient_body text;
begin
  select community.administrator_company_id, claim.reference, claim.title
  into company_id, claim_reference, claim_title
  from public.claims claim
  join public.communities community on community.id = claim.community_id
  where claim.id = new.claim_id;

  if new.sender_role = 'broker' then
    recipient_title := 'Nowa odpowiedź brokera';
    recipient_body := concat('Szkoda ', claim_reference, ': ', claim_title);
    insert into public.notifications (recipient_id, notification_type, claim_id, title, body)
    select profile.id, 'claim_message', new.claim_id, recipient_title, recipient_body
    from public.profiles profile
    where profile.role = 'administrator'
      and profile.administrator_company_id = company_id;
  else
    recipient_title := 'Nowa odpowiedź administratora';
    recipient_body := concat('Szkoda ', claim_reference, ': ', claim_title);
    insert into public.notifications (recipient_id, notification_type, claim_id, title, body)
    select profile.id, 'claim_message', new.claim_id, recipient_title, recipient_body
    from public.profiles profile
    where profile.role = 'broker';
  end if;
  return new;
end;
$$;

drop trigger if exists after_claim_message_insert_notify_recipient on public.claim_messages;
create trigger after_claim_message_insert_notify_recipient
  after insert on public.claim_messages
  for each row execute procedure public.notify_claim_message_recipient();

create or replace function public.notify_administrators_about_claim_status()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  company_id uuid;
  title_text text;
  body_text text;
begin
  if old.status is not distinct from new.status then
    return new;
  end if;

  select administrator_company_id into company_id
  from public.communities
  where id = new.community_id;

  title_text := case new.status
    when 'received' then 'Szkoda została przyjęta'
    when 'submitted_to_insurer' then 'Szkoda została zgłoszona do ubezpieczyciela'
    when 'insurer_claim_number_assigned' then 'Ubezpieczyciel nadał numer szkody'
    when 'rejected' then 'Szkoda została odrzucona'
    when 'accepted' then 'Szkoda została zaakceptowana'
    when 'paid' then 'Szkoda została wypłacona'
    else 'Status szkody został zmieniony'
  end;
  body_text := concat('Szkoda ', new.reference, ': ', new.title, case when new.status = 'paid' and new.paid_amount is not null then concat(' · wypłata ', new.paid_amount::text, ' PLN') else '' end);

  insert into public.notifications (recipient_id, notification_type, claim_id, title, body)
  select profile.id, 'claim_status_changed', new.id, title_text, body_text
  from public.profiles profile
  where profile.role = 'administrator'
    and profile.administrator_company_id = company_id;
  return new;
end;
$$;

drop trigger if exists after_claim_status_update_notify_administrators on public.claims;
create trigger after_claim_status_update_notify_administrators
  after update of status on public.claims
  for each row execute procedure public.notify_administrators_about_claim_status();
