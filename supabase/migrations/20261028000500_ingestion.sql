-- 0500: ingestion bookkeeping (private schema).
-- Every import from an external source is recorded so data can be audited,
-- re-run, or rolled back. Only service_role (Edge Functions / CI jobs) can
-- read or write here.

create table ingest.runs (
  id              uuid primary key default gen_random_uuid(),
  source_id       uuid not null references catalog.data_sources (id) on delete restrict,
  status          text not null default 'running'
                    check (status in ('running', 'succeeded', 'failed', 'cancelled')),
  triggered_by    text not null check (triggered_by in ('schedule', 'manual', 'ci')),
  started_at      timestamptz not null default now(),
  finished_at     timestamptz,
  records_seen    integer not null default 0 check (records_seen >= 0),
  records_written integer not null default 0 check (records_written >= 0),
  records_skipped integer not null default 0 check (records_skipped >= 0),
  error_summary   text check (error_summary is null or char_length(error_summary) <= 2000),
  metadata        jsonb not null default '{}'::jsonb check (jsonb_typeof(metadata) = 'object'),
  check (finished_at is null or finished_at >= started_at),
  check ((status = 'running') = (finished_at is null))
);
create index runs_source_started_idx on ingest.runs (source_id, started_at desc);
-- At most one in-flight run per source prevents overlapping scheduled jobs.
create unique index runs_one_running_per_source on ingest.runs (source_id) where status = 'running';

create table ingest.run_items (
  id           bigint generated always as identity primary key,
  run_id       uuid not null references ingest.runs (id) on delete cascade,
  external_id  text not null,
  target_table text not null check (target_table in ('catalog.cards', 'catalog.card_sets', 'catalog.archetypes')),
  action       text not null check (action in ('inserted', 'updated', 'skipped', 'rejected')),
  reason       text,
  created_at   timestamptz not null default now()
);
create index run_items_run_idx on ingest.run_items (run_id);

alter table ingest.runs enable row level security;
alter table ingest.run_items enable row level security;
-- Intentionally no policies: only service_role (which bypasses RLS) may access.

revoke all on all tables in schema ingest from public, anon, authenticated;
grant all on all tables in schema ingest to service_role;
grant usage, select on all sequences in schema ingest to service_role;
