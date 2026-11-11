create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  email text not null,
  full_name text not null default '',
  role text not null default 'sales' check (role in ('owner', 'admin', 'sales')),
  created_at timestamptz not null default now()
);

create unique index profiles_single_owner on public.profiles ((role))
  where role = 'owner';

create table public.leads (
  id uuid primary key default gen_random_uuid(),
  company text not null,
  pic text,
  job_title text,
  phone text,
  email text,
  industry text,
  commodity text,
  modes text[] not null default '{}',
  services text[] not null default '{}',
  origin text,
  destination text,
  volume numeric,
  unit text,
  incoterm text,
  frequency text,
  estimated_value numeric not null default 0,
  source text,
  stage text not null default 'baru'
    check (stage in ('baru', 'hubungi', 'kualifikasi', 'penawaran', 'nego', 'won', 'lost')),
  temperature text,
  follow_up date,
  notes text,
  lost_reason text,
  closed_at timestamptz,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index leads_created_by_idx on public.leads (created_by);
create index leads_stage_follow_up_idx on public.leads (stage, follow_up);

create function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  insert into public.profiles (id, email, full_name, role)
  values (
    new.id,
    coalesce(new.email, ''),
    coalesce(new.raw_user_meta_data ->> 'full_name', ''),
    'sales'
  )
  on conflict (id) do update set email = excluded.email;
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger leads_updated_at
  before update on public.leads
  for each row execute procedure public.set_updated_at();

alter table public.profiles enable row level security;
alter table public.leads enable row level security;

create policy "Signed-in users can view all profiles"
  on public.profiles for select to authenticated using (true);

create policy "Signed-in users can view all leads"
  on public.leads for select to authenticated using (true);

create policy "Users can create leads as themselves"
  on public.leads for insert to authenticated
  with check (created_by = (select auth.uid()));

create policy "Creators can update their own leads"
  on public.leads for update to authenticated
  using (created_by = (select auth.uid()))
  with check (created_by = (select auth.uid()));

create policy "Creators can delete their own leads"
  on public.leads for delete to authenticated
  using (created_by = (select auth.uid()));

grant select on public.profiles to authenticated;
grant select, insert, update, delete on public.leads to authenticated;
