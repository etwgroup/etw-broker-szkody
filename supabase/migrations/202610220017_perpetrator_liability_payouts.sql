-- Marks payouts paid from the perpetrator's third-party liability insurance.
-- Those amounts are displayed separately and are excluded from community loss reporting.

alter table public.claims
  add column if not exists paid_from_perpetrator_liability boolean not null default false;

comment on column public.claims.paid_from_perpetrator_liability is
  'True when the compensation was paid from the perpetrator liability policy and must not count toward community loss ratio.';

create or replace function public.set_claim_payout_details()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if new.status = 'paid' then
    if new.paid_amount is null or new.paid_amount <= 0 then
      raise exception 'Przy statusie „Wypłacona” podaj kwotę wypłaty większą od zera.';
    end if;

    if new.paid_at is null then
      new.paid_at := current_date;
    end if;
  else
    new.paid_from_perpetrator_liability := false;
  end if;

  return new;
end;
$$;

drop trigger if exists before_claim_status_set_payout on public.claims;
create trigger before_claim_status_set_payout
  before insert or update of status, paid_amount, paid_from_perpetrator_liability on public.claims
  for each row execute procedure public.set_claim_payout_details();
