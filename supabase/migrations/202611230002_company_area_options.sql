alter table public.lead_options
  drop constraint if exists lead_options_category_check;

alter table public.lead_options
  add constraint lead_options_category_check check (
    category in (
      'industries',
      'company_areas',
      'modes',
      'services',
      'sources',
      'units',
      'incoterms',
      'frequencies',
      'temperatures',
      'lost_reasons'
    )
  );
