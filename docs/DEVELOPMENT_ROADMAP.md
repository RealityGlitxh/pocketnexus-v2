# Development Roadmap

## Phase 0 — Foundation (this phase)

### Verification status (updated 2026‑10‑28, Phase 0.1)

**Readiness decision: NOT READY for Phase 1.** The npm registry and GitHub authentication are
unavailable in the build environment, so dependencies have never been installed and the web app
has never been compiled by `tsc`, linted, unit-tested under Vitest, built, or rendered in a browser.
Those are critical gates, not formalities.

Legend: ✅ executed and passed · ❌ blocked · ⏳ written, not executed

| Check | Status | Evidence |
| --- | --- | --- |
| `pnpm-lock.yaml` generated | ❌ Blocked | registry connection rejected by environment policy; not hand-written (would require fabricated integrity hashes) |
| `pnpm install --frozen-lockfile` | ❌ Blocked | needs lockfile + registry |
| Prettier / ESLint | ⏳ Not run | needs installed deps |
| `tsc` for `apps/web`, `packages/ui` | ⏳ Not run | needs `@types/react` etc. |
| `tsc` for `packages/shared`, `packages/database` (strict) | ✅ Pass | local TypeScript 6.0.3 |
| esbuild resolution check of all web/ui source + 14 test files | ✅ Pass (78 modules, 0 errors) | catches syntax errors, broken `@/` or relative imports, missing named exports; verified it fails on a planted bad import. **Not a type check.** |
| Vitest — shared (15), auth transitions (10), status indicators (6) | ✅ 31/31 pass | executed via local harness with the real zod v4 API, not Vitest |
| Vitest — remaining web (57) and ui (10) component/integration tests | ⏳ Not run | need jsdom, Testing Library, React Router, Radix |
| `vite build` + bundle budgets | ⏳ Not run | needs installed deps |
| Playwright + axe, desktop/tablet/mobile (16 tests × 3 projects) | ⏳ Not run | needs build + browsers |
| DB migrations + RLS on a disposable PostgreSQL 16.15 database | ✅ 41/41 pass | database dropped after run |
| RLS suite catches regressions (mutation test, 6 injected weaknesses) | ✅ 6/6 caught | run on a repo copy |
| Dev seed idempotent | ✅ Pass | |
| Contrast (both themes, 26 pairs each) | ✅ Pass | found and fixed 2 more dark-theme failures in 0.1 |
| Secret scan (source + build output) | ✅ Pass | verified against a planted key |
| Workflow YAML validity | ✅ Pass | found and fixed a YAML error that would have stopped the Phase 0 deploy workflow from loading |
| Deploy gate logic (8 scenarios incl. fork-named-`main`) | ✅ 8/8 correct | executed with stubbed `gh` |
| Dev Supabase project + migrations | ✅ Created & applied | `shodljlzwfsuouignvkv`; migration filenames aligned with hosted history |
| RLS suite on the hosted dev database | ✅ Pass (rolled back) | one timing check is only meaningful locally (single-transaction `now()`) |
| Auth flows against the dev project | ❌ Blocked | sandbox cannot reach `*.supabase.co`; needs a running app |
| GitHub CI run | ❌ Blocked | repo not created (invalid GitHub token) |
| Cloudflare staging deploy + URL verification | ❌ Blocked | no Pages project / credentials |

### Critical items before Phase 1
1. With registry access: `pnpm install` (commit `pnpm-lock.yaml`), `pnpm install --frozen-lockfile`,
   `pnpm verify`, `pnpm test:e2e`. Fix every failure; expect some type/lint findings in code that
   has never been compiled.
2. Review Playwright screenshots of every route at 320 px, tablet, and desktop.
3. Create the dev Supabase project; verify sign-up → profile → sign-in → reset → sign-out.
4. Run migrations through `supabase db reset` (CLI, Postgres 17) in addition to the shim tests.
5. Create the GitHub repo, enable branch protection requiring all three CI jobs; confirm green.
6. Create the Cloudflare Pages project; confirm the deploy workflow's URL verification passes.

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
