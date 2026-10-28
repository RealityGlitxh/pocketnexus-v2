-- PocketNexus 2.0 — Phase 0 foundation
-- 0100: extensions, schemas, shared helpers.
--
-- Conventions (see docs/DATABASE_SCHEMA.md):
--   public   → user-owned data, every table has RLS + explicit policies
--   catalog  → externally sourced reference data, read-only to clients
--   ingest   → ingestion bookkeeping, service-role only, NOT exposed via API
--
-- All functions set search_path = '' and fully qualify names to prevent
-- search_path hijacking.

create extension if not exists citext with schema extensions;
create extension if not exists pg_trgm with schema extensions;

create schema if not exists catalog;
create schema if not exists ingest;

comment on schema catalog is 'Externally sourced reference data (cards, sets, archetypes, data sources). Read-only for clients.';
comment on schema ingest  is 'Ingestion bookkeeping. Service-role only; never exposed through the Data API.';

-- Clients may read the catalog; nobody but service_role touches ingest.
grant usage on schema catalog to anon, authenticated, service_role;
revoke all on schema ingest from public, anon, authenticated;
grant usage on schema ingest to service_role;

-- updated_at maintenance -------------------------------------------------------
create or replace function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

comment on function public.set_updated_at() is 'Trigger: stamps updated_at on every UPDATE.';
