# Migration Strategy — V8 → V2

**Status:** strategy only. No production data has been read, copied, or imported. Phase 0 explicitly
forbids production imports.

## 1. Decide the auth home (blocking decision for the owner)

| Option | Pros | Cons |
| --- | --- | --- |
| **A. New Supabase project for V2** (recommended) | Clean schema, clean RLS, no V8 drift; V8 keeps running untouched | Users must be migrated; OAuth identities re-linked; password hashes moved via Supabase-supported export/import |
| B. Reuse V8 project with new schema | No user migration | Inherits undocumented tables/policies; risk of breaking live V8; violates "do not reuse production" in Phase 0 |

Phase 0 assumes **Option A**. `parseClientEnv` actively refuses the V8 project ref.

## 2. Table mapping (to confirm against the real schema dump)

| V8 table (inferred) | V2 target | Notes |
| --- | --- | --- |
| `auth.users` | `auth.users` (new project) | Migrated by Supabase tooling; `handle_new_user` must not overwrite migrated profiles — run profile import first with the trigger disabled in a maintenance window |
| `profiles` | `public.profiles` | Username normalised to `^[A-Za-z0-9_]{3,24}$`; collisions resolved case-insensitively; default visibility `private` unless V8 recorded explicit public consent |
| `cloud_preferences` | `public.user_preferences` | Map theme/motion/locale; drop unknown keys |
| `cloud_decks` (+ embedded card lists) | `public.decks` + `public.deck_cards` | Card ids remapped to `catalog.cards.id`; decks referencing unknown cards imported as drafts with a migration note |
| `cloud_matches` | `public.match_records` | Archetype names mapped to `catalog.archetypes.slug`; unmapped → `null` + note |
| `cloud_collection`, `cloud_rank_history`, training, teams, streamer, AI tables | *Phase 2+* | Not in Phase 0 schema; designed when those features are rebuilt |
| `meta_*`, `competitive_events`, `simulation_*` | **Not migrated** | Re-ingested from reviewed sources with provenance (`catalog.data_sources`, `ingest.runs`) |

## 3. Process

1. Schema dump (read-only) → write a mapping spec per table with column-level transforms.
2. Build migration scripts as **idempotent, re-runnable** jobs keyed by V8 primary keys
   (store `legacy_id` in a side table, not in product tables).
3. Dry-run against the **verified backup restore** (Archive Plan Phase B), never against production.
4. Validate: row counts, per-user spot checks, RLS checks as the migrated user.
5. Cut-over window: V8 read-only banner → final delta export → import → DNS switch.
6. Keep V8 read-only for a grace period; users can compare.

## 4. Privacy

- Only data needed for V2 features is migrated (data minimisation).
- Email addresses remain only in `auth.users`.
- AI conversation history is **not** migrated without fresh user consent.
