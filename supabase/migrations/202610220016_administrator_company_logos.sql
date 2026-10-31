-- Branding assets for administrator companies. Logos are intentionally public:
-- they contain company branding only and must render on cards without expiring URLs.

alter table public.administrator_companies
  add column if not exists logo_path text;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'administrator-company-logos',
  'administrator-company-logos',
  true,
  2097152,
  array['image/png', 'image/jpeg', 'image/webp']
)
on conflict (id) do update
set public = excluded.public,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "storage: broker can upload company logo" on storage.objects;
drop policy if exists "storage: broker can update company logo" on storage.objects;
drop policy if exists "storage: broker can delete company logo" on storage.objects;

create policy "storage: broker can upload company logo" on storage.objects
  for insert with check (
    bucket_id = 'administrator-company-logos'
    and public.is_broker()
  );

create policy "storage: broker can update company logo" on storage.objects
  for update using (
    bucket_id = 'administrator-company-logos'
    and public.is_broker()
  ) with check (
    bucket_id = 'administrator-company-logos'
    and public.is_broker()
  );

create policy "storage: broker can delete company logo" on storage.objects
  for delete using (
    bucket_id = 'administrator-company-logos'
    and public.is_broker()
  );
