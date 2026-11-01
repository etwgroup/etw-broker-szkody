-- Successful sign-in register for the broker-only user activity report.
-- No passwords or IP addresses are stored here.

create table if not exists public.user_login_events (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references public.profiles(id) on delete set null,
  full_name text not null,
  email text,
  role public.user_role not null,
  company_name text,
  device_label text,
  logged_in_at timestamptz not null default now()
);

create index if not exists user_login_events_logged_in_at_idx
  on public.user_login_events (logged_in_at desc);

create index if not exists user_login_events_user_id_logged_in_at_idx
  on public.user_login_events (user_id, logged_in_at desc);

alter table public.user_login_events enable row level security;

drop policy if exists "login event: broker can read" on public.user_login_events;
create policy "login event: broker can read" on public.user_login_events
  for select using (public.is_broker());
