-- One row per imported APA timetable dataset. Only one dataset per term is published at a time.
create table public.published_datasets (
  id bigint generated always as identity primary key,
  academic_year int not null,
  trimester text not null check (trimester in ('T1', 'T2', 'T3')),
  version text not null,
  source_file text not null,
  data jsonb not null,
  is_published boolean not null default false,
  created_at timestamptz not null default now(),
  unique (academic_year, trimester, version)
);

create unique index published_datasets_one_published_per_term
  on public.published_datasets (academic_year, trimester)
  where is_published;

-- Private by default: RLS on, no policies, and no table grants for browser roles.
-- Only the server (secret key) can read or write.
alter table public.published_datasets enable row level security;
revoke all on public.published_datasets from anon, authenticated;
