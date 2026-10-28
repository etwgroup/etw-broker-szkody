-- Give every administrator account in a company access to that company's policy files.
-- Run after migrations 001–006.

drop policy if exists "policy: community administrator or broker can read" on public.insurance_policies;

create policy "policy: company administrator or broker can read" on public.insurance_policies
  for select using (
    public.is_broker() or exists (
      select 1
      from public.communities c
      where c.id = community_id
        and c.administrator_company_id = public.current_administrator_company_id()
    )
  );
