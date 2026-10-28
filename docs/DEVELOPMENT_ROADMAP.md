# Development Roadmap

## Phase 0 — Foundation (this phase)

### Verification status (2026‑10‑28)

The Phase 0 build environment **could not reach the npm registry**, so `pnpm install` never ran.
Checks are therefore split into what was actually executed and what is written but unexecuted.

| Check | Status | Evidence |
| --- | --- | --- |
| DB migrations apply cleanly (PostgreSQL 16.15 + Supabase shim) | ✅ **Executed, pass** | 6 migrations |
| RLS / privilege test suite | ✅ **Executed, 41/41 pass** | `supabase/tests/10_rls_policies.sql` |
| Dev seed idempotent | ✅ **Executed, pass** | applied twice |
| `packages/shared` typecheck (strict) | ✅ **Executed, pass** | local TypeScript 6.0.3 |
| `packages/shared` unit tests | ✅ **Executed, 15/15 pass** | zod v4 API via local harness (not Vitest) |
| `packages/database` typecheck | ✅ **Executed, pass** | local TypeScript 6.0.3 |
| Color contrast (both themes) | ✅ **Executed, all pass** after fixing 4 failures | `scripts/check-contrast.mjs` |
| Secret scan | ✅ **Executed, pass**; verified it catches a planted key | `scripts/check-no-secrets.mjs` |
| `pnpm install` / lockfile | ❌ **Blocked** | registry unreachable |
| Typecheck `apps/web`, `packages/ui` | ⏳ Not run | needs installed deps |
| ESLint, Prettier | ⏳ Not run | needs installed deps |
| Vitest: `packages/ui` (10 tests), `apps/web` (26 tests) | ⏳ Written, not run | needs installed deps |
| `vite build`, bundle budgets | ⏳ Not run | needs installed deps |
| Playwright e2e + axe (desktop/tablet/mobile) | ⏳ Written, not run | needs build |
| Shell visually checked on desktop/mobile | ⏳ Not done | needs build |
| Auth against a dev Supabase project | ⛔ **Blocked** | no dev project / credentials |
| CI on GitHub | ⛔ **Blocked** | repo not created |
| Cloudflare staging deploy | ⏳ **Pending** | needs owner setup |

**Phase 0 is not complete** until the ⏳/⛔ rows are green. The fastest path: run
`pnpm install && pnpm verify && pnpm test:e2e` on a machine with registry access, fix whatever it
surfaces, commit the lockfile, then follow DEPLOYMENT.md.

### Remaining Phase 0 tasks
1. Install, generate lockfile, run `pnpm verify`; fix any type/lint/test failures.
2. Run Playwright on desktop/tablet/mobile; review screenshots of every route.
3. Create the dev Supabase project; verify sign-up → profile initialisation → sign-in → reset.
4. Run migrations through `supabase db reset` (CLI) in addition to the shim tests.
5. Create the GitHub repo with branch protection; confirm CI is green.
6. Create the Cloudflare Pages project; confirm staging deploy + smoke test.

## Phase 1 — Core data & decks
- Data source review: confirm terms for each card/tournament source; register in
  `catalog.data_sources` with `is_active = false` until approved.
- Ingestion Edge Function (service-role, scheduled, authenticated) writing `ingest.runs`.
- Card Database: server-side search (trigram), filters, pagination, card detail, image strategy.
- Deck Lab: builder with full rule validation (incl. energy-type limits from card metadata),
  saved decks, sharing via `get_shared_deck`.
- Profile editing + avatar upload; account settings (email, password, data export, deletion).
- Replace hand-written DB types with generated types; adopt pgTAP via `supabase test db`.
- Lighthouse CI against staging with the runtime budgets in ARCHITECTURE.md.
- Error reporting with PII scrubbing; CAPTCHA on sign-up.

## Phase 2 — Competitive loop
- Battle Tracker (match logging, per-deck and per-matchup stats from the user's own records).
- Meta Center (archetype library, trends from reviewed sources, provenance on every figure).
- Legacy data migration dry-runs against a verified backup (see MIGRATION_STRATEGY.md).

## Phase 3+ — Breadth (re-introduced individually)
Rank tracking, teams/tournaments, training tools, streamer overlays, AI coaching — each as an
isolated feature module with its own schema, RLS tests, and route chunk.
