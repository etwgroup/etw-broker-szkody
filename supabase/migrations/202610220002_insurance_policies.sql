-- Policies belong to a community. Document files remain private in Supabase Storage.

create table public.insurance_policies (
  id uuid primary key default gen_random_uuid(),
  community_id uuid not null references public.communities(id) on delete cascade,
  insurer text not null,
  policy_number text not null,
  valid_from date not null,
  valid_to date not null,
  file_name text,
  storage_path text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (valid_to >= valid_from)
);

create index insurance_policies_community_id_idx on public.insurance_policies(community_id);
create index insurance_policies_valid_to_idx on public.insurance_policies(valid_to desc);

create trigger before_insurance_policy_update
  before update on public.insurance_policies
  for each row execute procedure public.update_claim_timestamp();

alter table public.insurance_policies enable row level security;

create policy "policy: community administrator or broker can read" on public.insurance_policies for select using (
  public.is_broker() or exists (select 1 from public.communities c where c.id = community_id and c.administrator_id = auth.uid())
);
create policy "policy: broker can create" on public.insurance_policies for insert with check (public.is_broker());
create policy "policy: broker can update" on public.insurance_policies for update using (public.is_broker()) with check (public.is_broker());
create policy "policy: broker can delete" on public.insurance_policies for delete using (public.is_broker());

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('policy-documents', 'policy-documents', false, 20971520, array['application/pdf'])
on conflict (id) do nothing;

create policy "storage: policy reader can download" on storage.objects for select using (
  bucket_id = 'policy-documents' and exists (
    select 1 from public.insurance_policies p where p.storage_path = name
  )
);
create policy "storage: broker can upload policy" on storage.objects for insert with check (
  bucket_id = 'policy-documents' and public.is_broker()
);
