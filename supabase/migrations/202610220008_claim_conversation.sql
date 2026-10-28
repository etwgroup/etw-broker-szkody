-- Private two-way conversation and document exchange for a claim.
-- Run after migrations 001–007.

create table public.claim_messages (
  id uuid primary key default gen_random_uuid(),
  claim_id uuid not null references public.claims(id) on delete cascade,
  sender_id uuid not null references public.profiles(id) on delete restrict,
  sender_role public.user_role not null,
  sender_name text,
  body text not null default '' check (char_length(body) <= 2000),
  requires_action boolean not null default false,
  created_at timestamptz not null default now()
);

create table public.claim_message_attachments (
  id uuid primary key default gen_random_uuid(),
  message_id uuid not null references public.claim_messages(id) on delete cascade,
  file_name text not null,
  storage_path text not null unique,
  mime_type text,
  size_bytes bigint check (size_bytes is null or size_bytes <= 20971520),
  uploaded_by uuid not null references public.profiles(id) on delete restrict,
  created_at timestamptz not null default now()
);

create index claim_messages_claim_id_created_at_idx on public.claim_messages(claim_id, created_at);
create index claim_message_attachments_message_id_idx on public.claim_message_attachments(message_id);

create or replace function public.can_access_claim(target_claim_id uuid)
returns boolean language sql stable security definer set search_path = public as $$
  select public.is_broker() or exists (
    select 1
    from public.claims claim
    join public.communities community on community.id = claim.community_id
    where claim.id = target_claim_id
      and community.administrator_company_id = public.current_administrator_company_id()
  );
$$;

create or replace function public.set_claim_message_sender()
returns trigger language plpgsql security definer set search_path = public as $$
declare
  profile_role public.user_role;
  profile_name text;
begin
  if auth.uid() is null then
    raise exception 'Wiadomość wymaga zalogowanego użytkownika.';
  end if;

  select role, full_name into profile_role, profile_name
  from public.profiles
  where id = auth.uid();

  if profile_role is null then
    raise exception 'Nie znaleziono profilu użytkownika.';
  end if;

  new.sender_id := auth.uid();
  new.sender_role := profile_role;
  new.sender_name := coalesce(nullif(btrim(profile_name), ''), case when profile_role = 'broker' then 'Broker ETW' else 'Administrator' end);
  new.body := btrim(coalesce(new.body, ''));

  if new.requires_action and profile_role <> 'broker' then
    raise exception 'Tylko broker może oznaczyć wiadomość jako wymagającą działania.';
  end if;

  return new;
end;
$$;

create trigger before_claim_message_insert
  before insert on public.claim_messages
  for each row execute procedure public.set_claim_message_sender();

alter table public.claim_messages enable row level security;
alter table public.claim_message_attachments enable row level security;

create policy "claim message: participants can read" on public.claim_messages
  for select using (public.can_access_claim(claim_id));
create policy "claim message: participants can add" on public.claim_messages
  for insert with check (sender_id = auth.uid() and public.can_access_claim(claim_id));

create policy "claim message attachment: participants can read" on public.claim_message_attachments
  for select using (exists (
    select 1 from public.claim_messages message
    where message.id = message_id
      and public.can_access_claim(message.claim_id)
  ));
create policy "claim message attachment: author can add" on public.claim_message_attachments
  for insert with check (
    uploaded_by = auth.uid() and exists (
      select 1 from public.claim_messages message
      where message.id = message_id
        and message.sender_id = auth.uid()
        and public.can_access_claim(message.claim_id)
    )
  );

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'claim-message-attachments',
  'claim-message-attachments',
  false,
  20971520,
  array[
    'image/jpeg', 'image/png', 'image/webp', 'application/pdf',
    'application/vnd.ms-excel', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
)
on conflict (id) do nothing;

create policy "storage: claim message reader can download" on storage.objects
  for select using (
    bucket_id = 'claim-message-attachments' and exists (
      select 1
      from public.claim_message_attachments attachment
      join public.claim_messages message on message.id = attachment.message_id
      where attachment.storage_path = name
        and public.can_access_claim(message.claim_id)
    )
  );

create policy "storage: claim participant can upload message file" on storage.objects
  for insert with check (
    bucket_id = 'claim-message-attachments' and exists (
      select 1
      from public.claims claim
      where claim.id::text = (storage.foldername(name))[1]
        and public.can_access_claim(claim.id)
    )
  );
