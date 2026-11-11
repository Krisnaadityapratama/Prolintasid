alter table public.profiles
  add column if not exists is_active boolean not null default true;

create or replace function public.is_active_user()
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.profiles
    where profiles.id = (select auth.uid())
      and profiles.is_active
  );
$$;

revoke all on function public.is_active_user() from public;
grant execute on function public.is_active_user() to authenticated;

drop policy if exists "Signed-in users can view all profiles" on public.profiles;
create policy "Users can view profiles while active"
  on public.profiles for select to authenticated
  using (id = (select auth.uid()) or (select public.is_active_user()));

drop policy if exists "Signed-in users can view all leads" on public.leads;
create policy "Active users can view all leads"
  on public.leads for select to authenticated
  using ((select public.is_active_user()));

drop policy if exists "Users can create leads as themselves" on public.leads;
create policy "Active users can create leads as themselves"
  on public.leads for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.is_active_user())
  );

drop policy if exists "Creators can update their own leads" on public.leads;
create policy "Active creators can update their own leads"
  on public.leads for update to authenticated
  using (
    created_by = (select auth.uid())
    and (select public.is_active_user())
  )
  with check (
    created_by = (select auth.uid())
    and (select public.is_active_user())
  );

drop policy if exists "Creators can delete their own leads" on public.leads;
create policy "Active creators can delete their own leads"
  on public.leads for delete to authenticated
  using (
    created_by = (select auth.uid())
    and (select public.is_active_user())
  );

drop policy if exists "Signed-in users can view lead options" on public.lead_options;
create policy "Active users can view lead options"
  on public.lead_options for select to authenticated
  using ((select public.is_active_user()));

drop policy if exists "Admins can add lead options" on public.lead_options;
create policy "Active admins can add lead options"
  on public.lead_options for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and (select public.is_active_user())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('owner', 'admin')
    )
  );

drop policy if exists "Admins can delete lead options" on public.lead_options;
create policy "Active admins can delete lead options"
  on public.lead_options for delete to authenticated
  using (
    (select public.is_active_user())
    and exists (
      select 1 from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('owner', 'admin')
    )
  );
