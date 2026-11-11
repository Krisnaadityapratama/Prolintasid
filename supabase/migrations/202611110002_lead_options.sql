create table if not exists public.lead_options (
  id uuid primary key default gen_random_uuid(),
  category text not null check (
    category in (
      'industries',
      'modes',
      'services',
      'sources',
      'units',
      'incoterms',
      'frequencies',
      'temperatures',
      'lost_reasons'
    )
  ),
  label text not null check (char_length(btrim(label)) between 1 and 80),
  sort_order integer not null default 0,
  created_by uuid not null references public.profiles(id),
  created_at timestamptz not null default now()
);

create unique index if not exists lead_options_category_label_unique
  on public.lead_options (category, lower(label));

create index if not exists lead_options_category_sort_idx
  on public.lead_options (category, sort_order, label);

alter table public.lead_options enable row level security;

drop policy if exists "Signed-in users can view lead options" on public.lead_options;
create policy "Signed-in users can view lead options"
  on public.lead_options for select to authenticated using (true);

drop policy if exists "Admins can add lead options" on public.lead_options;
create policy "Admins can add lead options"
  on public.lead_options for insert to authenticated
  with check (
    created_by = (select auth.uid())
    and exists (
      select 1
      from public.profiles
      where profiles.id = (select auth.uid())
        and profiles.role in ('owner', 'admin')
    )
  );

grant select, insert on public.lead_options to authenticated;

insert into public.lead_options (category, label, sort_order, created_by)
select seed.category, seed.label, seed.sort_order, profile.id
from (
  values
    ('industries', 'Manufaktur', 10),
    ('industries', 'Garmen & Tekstil', 20),
    ('industries', 'Makanan & Minuman', 30),
    ('industries', 'Elektronik', 40),
    ('industries', 'Otomotif & Sparepart', 50),
    ('industries', 'Kimia & Plastik', 60),
    ('industries', 'FMCG / Retail', 70),
    ('industries', 'E-commerce', 80),
    ('industries', 'Pertambangan & Energi', 90),
    ('industries', 'Pertanian & Komoditas', 100),
    ('industries', 'Furnitur', 110),
    ('industries', 'Lainnya', 120),
    ('modes', 'Sea FCL', 10),
    ('modes', 'Sea LCL', 20),
    ('modes', 'Air Freight', 30),
    ('modes', 'Trucking', 40),
    ('modes', 'Multimoda', 50),
    ('services', 'Ekspor', 10),
    ('services', 'Impor', 20),
    ('services', 'Domestik', 30),
    ('services', 'Customs Clearance', 40),
    ('services', 'Gudang & Distribusi', 50),
    ('services', 'Project Cargo', 60),
    ('sources', 'Referral', 10),
    ('sources', 'Cold call / kunjungan', 20),
    ('sources', 'Pameran / event', 30),
    ('sources', 'Media sosial & website', 40),
    ('sources', 'Partner agen luar negeri', 50),
    ('sources', 'Tender / RFQ', 60),
    ('sources', 'Pelanggan lama', 70),
    ('units', 'TEU', 10),
    ('units', 'CBM', 20),
    ('units', 'Kg', 30),
    ('units', 'Ton', 40),
    ('units', 'Shipment', 50),
    ('incoterms', 'EXW', 10),
    ('incoterms', 'FCA', 20),
    ('incoterms', 'FOB', 30),
    ('incoterms', 'CFR', 40),
    ('incoterms', 'CIF', 50),
    ('incoterms', 'DAP', 60),
    ('incoterms', 'DDP', 70),
    ('frequencies', 'Spot (sekali kirim)', 10),
    ('frequencies', 'Rutin mingguan', 20),
    ('frequencies', 'Rutin bulanan', 30),
    ('frequencies', 'Kontrak / tender tahunan', 40),
    ('temperatures', 'Panas', 10),
    ('temperatures', 'Hangat', 20),
    ('temperatures', 'Dingin', 30),
    ('lost_reasons', 'Harga lebih tinggi', 10),
    ('lost_reasons', 'Pakai kompetitor', 20),
    ('lost_reasons', 'Tidak ada kebutuhan', 30),
    ('lost_reasons', 'Tidak responsif', 40),
    ('lost_reasons', 'Lainnya', 50)
) as seed(category, label, sort_order)
cross join lateral (
  select id from public.profiles where role = 'owner' order by created_at limit 1
) as profile
on conflict do nothing;
