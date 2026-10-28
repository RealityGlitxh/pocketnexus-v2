-- 0200: catalog schema — externally sourced, read-only reference data.
-- Writes happen only through service_role (ingestion jobs / admin tooling).

-- Where data comes from. Publicly readable so the UI can attribute sources.
create table catalog.data_sources (
  id           uuid primary key default gen_random_uuid(),
  slug         text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name         text not null check (char_length(name) between 1 and 120),
  kind         text not null check (kind in ('card_catalog', 'tournament_results', 'meta_snapshot', 'manual')),
  base_url     text check (base_url is null or base_url ~ '^https://'),
  terms_url    text check (terms_url is null or terms_url ~ '^https://'),
  attribution  text check (attribution is null or char_length(attribution) <= 500),
  is_active    boolean not null default false,
  notes        text,
  created_at   timestamptz not null default now(),
  updated_at   timestamptz not null default now()
);
comment on table catalog.data_sources is 'Registered external data sources. is_active=false until terms of use are reviewed.';

create table catalog.card_sets (
  id            text primary key check (id ~ '^[A-Za-z0-9]{1,8}$'),  -- e.g. "A1", "A2a", "P-A" style codes normalised
  name          text not null check (char_length(name) between 1 and 120),
  series        text,
  release_date  date,
  card_count    integer check (card_count is null or card_count >= 0),
  source_id     uuid references catalog.data_sources (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);

create table catalog.cards (
  id            text primary key check (id ~ '^[A-Za-z0-9]{1,8}-[A-Za-z0-9]{1,8}$'), -- "<set>-<number>"
  set_id        text not null references catalog.card_sets (id) on delete restrict,
  number        text not null,
  name          text not null check (char_length(name) between 1 and 120),
  supertype     text not null check (supertype in ('pokemon', 'trainer', 'energy')),
  subtype       text,                      -- e.g. basic / stage1 / item / supporter / tool
  energy_type   text,                      -- grass, fire, water, … (null for trainers)
  rarity        text,
  hp            smallint check (hp is null or hp between 0 and 1000),
  is_ex         boolean not null default false,
  image_path    text,                      -- Storage path or vetted CDN path; never hotlinked third-party art
  attributes    jsonb not null default '{}'::jsonb check (jsonb_typeof(attributes) = 'object'),
  source_id     uuid references catalog.data_sources (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now(),
  unique (set_id, number)
);
create index cards_set_id_idx on catalog.cards (set_id);
create index cards_supertype_energy_idx on catalog.cards (supertype, energy_type);
create index cards_name_trgm_idx on catalog.cards using gin (name extensions.gin_trgm_ops);

create table catalog.archetypes (
  id            uuid primary key default gen_random_uuid(),
  slug          text not null unique check (slug ~ '^[a-z0-9][a-z0-9-]{1,62}$'),
  name          text not null check (char_length(name) between 1 and 80),
  description   text check (description is null or char_length(description) <= 2000),
  key_card_ids  text[] not null default '{}',
  is_active     boolean not null default true,
  source_id     uuid references catalog.data_sources (id) on delete set null,
  created_at    timestamptz not null default now(),
  updated_at    timestamptz not null default now()
);
create index archetypes_active_idx on catalog.archetypes (is_active) where is_active;

-- updated_at triggers
create trigger data_sources_updated_at before update on catalog.data_sources
  for each row execute function public.set_updated_at();
create trigger card_sets_updated_at before update on catalog.card_sets
  for each row execute function public.set_updated_at();
create trigger cards_updated_at before update on catalog.cards
  for each row execute function public.set_updated_at();
create trigger archetypes_updated_at before update on catalog.archetypes
  for each row execute function public.set_updated_at();

-- RLS: everyone may read; no client writes (service_role bypasses RLS).
alter table catalog.data_sources enable row level security;
alter table catalog.card_sets    enable row level security;
alter table catalog.cards        enable row level security;
alter table catalog.archetypes   enable row level security;

create policy "catalog data_sources are readable" on catalog.data_sources
  for select to anon, authenticated using (true);
create policy "catalog card_sets are readable" on catalog.card_sets
  for select to anon, authenticated using (true);
create policy "catalog cards are readable" on catalog.cards
  for select to anon, authenticated using (true);
create policy "catalog active archetypes are readable" on catalog.archetypes
  for select to anon, authenticated using (is_active);

-- Least privilege grants: clients get SELECT only.
revoke all on all tables in schema catalog from anon, authenticated;
grant select on all tables in schema catalog to anon, authenticated;
grant all on all tables in schema catalog to service_role;
