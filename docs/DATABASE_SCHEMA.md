# Database Schema (Phase 0)

Migrations: [`supabase/migrations/`](../supabase/migrations) — applied in filename order.

## Schemas

| Schema | Contents | Client access |
| --- | --- | --- |
| `public` | **User-owned data**: profiles, preferences, decks, deck cards, match records | RLS-scoped per user; column-level UPDATE grants |
| `catalog` | **Externally sourced reference data**: data sources, card sets, cards, archetypes | `SELECT` only (anon + authenticated). Writes via `service_role` |
| `ingest` | **Ingestion bookkeeping**: runs, run items | None. Not exposed by the Data API; `service_role` only |

## Tables

### public.profiles
`id uuid PK → auth.users(id) on delete cascade` · `username citext unique, ^[A-Za-z0-9_]{3,24}$` ·
`display_name` · `bio ≤280` · `avatar_path "<uid>/<file>"` · `visibility private|public (default private)` ·
timestamps. Created by trigger `on_auth_user_created`. **No email column** — email stays in `auth.users`.

### public.user_preferences
`user_id PK → profiles` · `theme dark|light|system` · `reduced_motion` · `locale` · timestamps.

### public.decks
`id uuid` · `owner_id → profiles (cascade)` · `name 1–60` · `description ≤500` ·
`visibility private|unlisted|public` · `archetype_id → catalog.archetypes (set null)` · timestamps.
Indexes: `(owner_id, updated_at desc)`, partial on public decks, `archetype_id`.

### public.deck_cards
PK `(deck_id, card_id)` · `card_id → catalog.cards (restrict)` · `quantity 1–2`.
Deferred constraint trigger caps a deck at **20 cards** (row-locks the parent deck to serialise
concurrent edits). Editing contents bumps `decks.updated_at`.

### public.match_records
`owner_id → profiles` · `deck_id → decks (set null)` · `opponent_archetype_id` ·
`result win|loss|draw` · `mode ranked|casual|event|practice` · `went_first` · `notes ≤1000` ·
`played_at`. Index `(owner_id, played_at desc)`.

### catalog.data_sources
`slug` · `kind card_catalog|tournament_results|meta_snapshot|manual` · `base_url`/`terms_url` (https) ·
`attribution` · `is_active` (**false until terms are reviewed**).

### catalog.card_sets, catalog.cards, catalog.archetypes
Cards keyed by `"<set>-<number>"`, trigram index on `name` for search, `attributes jsonb` for
game-specific fields. Every row can carry `source_id` for provenance.

### ingest.runs, ingest.run_items
One row per import; **at most one `running` run per source** (partial unique index) so scheduled
jobs can't overlap. Item-level audit of inserted/updated/skipped/rejected records.

## Access rules (RLS)

| Table | anon | authenticated |
| --- | --- | --- |
| profiles | read public | read own + public; update own (username, display_name, bio, avatar_path, visibility) |
| user_preferences | — | read/update own (theme, reduced_motion, locale) |
| decks | read public | read own + public; insert/delete own; update own (name, description, visibility, archetype_id) |
| deck_cards | read cards of public decks | read if deck readable; write only own decks |
| match_records | — | full CRUD on own; linked deck must be own |
| catalog.* | read | read |
| ingest.* | — | — |

**Unlisted decks** are not selectable by non-owners (prevents enumeration); they are served only
by `public.get_shared_deck(uuid)` (SECURITY DEFINER, pinned `search_path`), which also hides the
owner's username unless their profile is public.

Storage: bucket `avatars` (public read, 1 MB, png/jpeg/webp); users may write only under
`<their uid>/`.

## Testing

`pnpm db:test` (or `bash supabase/tests/run-local-postgres.sh`) creates a throwaway database on a
local PostgreSQL server, applies a minimal Supabase shim (roles, `auth.uid()`, storage), runs all
migrations, runs **41 RLS/privilege assertions**, and checks the dev seed is idempotent.

**Result in Phase 0:** all 41 assertions **passed** on PostgreSQL 16.15 (2026‑10‑28). The suite
caught one real bug during development (case-insensitive username collisions crashed sign-up
because `=` on `citext` resolved to case-sensitive text under `search_path = ''`); fixed in
migration 0300.

**Not yet done:** running migrations through the Supabase CLI local stack (`supabase db reset`)
and against a hosted development project. The shim approximates — but is not — Supabase.

## Types

`packages/database/src/database.types.ts` is hand-written to match the migrations. Once the Supabase
CLI is available, replace it with `pnpm --filter @pocketnexus/database gen:types`.

## Conventions for new migrations

- Filename `YYYYMMDDHHMMSS_description.sql`; never edit an applied migration.
- Every new table: RLS enabled, explicit policies, least-privilege grants, and tests in
  `supabase/tests/`.
- Functions: `set search_path = ''`, fully qualified names; SECURITY DEFINER only with a comment
  explaining why it is safe.
