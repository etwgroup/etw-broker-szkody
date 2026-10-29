-- Allows broker-confirmed deletion while retaining claim history after an account is removed.
-- Deleting a community is intentionally permanent and cascades to its claims and related records.

alter table public.communities
  alter column administrator_id drop not null;
alter table public.communities
  drop constraint if exists communities_administrator_id_fkey;
alter table public.communities
  add constraint communities_administrator_id_fkey
  foreign key (administrator_id) references public.profiles(id) on delete set null;

alter table public.claims
  drop constraint if exists claims_community_id_fkey,
  drop constraint if exists claims_created_by_fkey,
  alter column created_by drop not null;
alter table public.claims
  add constraint claims_community_id_fkey
  foreign key (community_id) references public.communities(id) on delete cascade,
  add constraint claims_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

alter table public.claim_attachments
  drop constraint if exists claim_attachments_uploaded_by_fkey,
  alter column uploaded_by drop not null;
alter table public.claim_attachments
  add constraint claim_attachments_uploaded_by_fkey
  foreign key (uploaded_by) references public.profiles(id) on delete set null;

alter table public.claim_messages
  drop constraint if exists claim_messages_sender_id_fkey,
  alter column sender_id drop not null;
alter table public.claim_messages
  add constraint claim_messages_sender_id_fkey
  foreign key (sender_id) references public.profiles(id) on delete set null;

alter table public.claim_message_attachments
  drop constraint if exists claim_message_attachments_uploaded_by_fkey,
  alter column uploaded_by drop not null;
alter table public.claim_message_attachments
  add constraint claim_message_attachments_uploaded_by_fkey
  foreign key (uploaded_by) references public.profiles(id) on delete set null;

alter table public.claim_internal_notes
  drop constraint if exists claim_internal_notes_created_by_fkey,
  alter column created_by drop not null;
alter table public.claim_internal_notes
  add constraint claim_internal_notes_created_by_fkey
  foreign key (created_by) references public.profiles(id) on delete set null;

drop policy if exists "notification: recipient can clear own history" on public.notifications;
create policy "notification: recipient can clear own history" on public.notifications
  for delete using (recipient_id = auth.uid());

grant delete on public.notifications to authenticated;

