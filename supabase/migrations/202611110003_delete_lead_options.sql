drop policy if exists "Admins can delete lead options" on public.lead_options;
create policy "Admins can delete lead options"
  on public.lead_options for delete to authenticated
  using (
    exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('owner', 'admin')
    )
  );

grant delete on public.lead_options to authenticated;
