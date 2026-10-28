-- Administrator accounts are activated by the person who receives the invite.
-- The broker never receives or stores an administrator password.

alter table public.profiles
  add column if not exists account_invited_at timestamptz,
  add column if not exists account_activated_at timestamptz;

-- Existing password accounts remain visible as active after this migration.
update public.profiles p
set account_activated_at = coalesce(p.account_activated_at, u.last_sign_in_at, u.email_confirmed_at, p.created_at)
from auth.users u
where u.id = p.id
  and (u.last_sign_in_at is not null or u.email_confirmed_at is not null);

create or replace function public.activate_own_account()
returns void
language plpgsql
security definer
set search_path = public, auth
as $$
begin
  if auth.uid() is null then
    raise exception 'Wymagane jest zalogowanie.';
  end if;

  if not exists (
    select 1
    from auth.users
    where id = auth.uid()
      and encrypted_password is not null
      and encrypted_password <> ''
  ) then
    raise exception 'Najpierw ustaw hasło do konta.';
  end if;

  update public.profiles
  set account_activated_at = coalesce(account_activated_at, now())
  where id = auth.uid();
end;
$$;

revoke all on function public.activate_own_account() from public;
grant execute on function public.activate_own_account() to authenticated;
