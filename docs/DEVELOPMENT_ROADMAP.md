# Development Roadmap

## Phase 0 — Foundation (this phase)

### Verification status (updated 2026‑10‑28, Phase 0.2)

All results below were produced on GitHub Actions runners (Node 22.23.4, pnpm 10.28.0); the dev
sandbox cannot reach the npm registry, so the lockfile was generated on a runner by a temporary
`bootstrap/lockfile` workflow and committed. Main-branch CI then verifies the committed lockfile
with `--frozen-lockfile`.

| Check | Result |
| --- | --- |
| `pnpm install` / `pnpm install --frozen-lockfile` | ✅ Pass |
| Prettier (`format:check`) | ✅ Pass |
| ESLint (type-aware, `--max-warnings=0`) | ✅ Pass |
| TypeScript (all 4 packages, strict) | ✅ Pass |
| Vitest: shared 15, ui 10, web 73 | ✅ 98/98 pass |
| Contrast (both themes) | ✅ Pass |
| `vite build` | ✅ Pass |
| Bundle budgets | ✅ Pass (initial JS 183.4 kB gz, budget re-baselined to 190 kB) |
| Secret scan (source + build) | ✅ Pass |
| `pnpm audit --prod --audit-level high` | ✅ Pass |
| Playwright + axe (desktop, tablet, mobile) | ✅ 46 passed, 2 intentionally skipped |
| Migrations + RLS on PostgreSQL 17 (CI) | ✅ Pass |
| Migrations + RLS on the hosted dev Supabase project | ✅ Pass (rolled back) |
| Auth flows against the dev project | ❌ Not tested: no deployed app yet |
| Cloudflare staging deploy | ❌ Not set up |

Defects found and fixed by these runs: `TabsTrigger` dropped caller classes; the mobile drawer did
not return focus to the menu button on Escape; hand-written database types made supabase-js type
query results as `null` (replaced with generated types); forcing `@supabase` into a manual chunk
made the dashboard load the SDK eagerly; a placeholder link's accessible name lacked a space; the
secret scan's OpenAI pattern matched CSS identifiers.

### Remaining before Phase 1
1. Cloudflare Pages staging project + secrets; confirm the deploy workflow's URL verification.
2. Supabase dev auth settings (site URL, redirect URLs, password policy) and an end-to-end
   sign-up → profile → sign-in → reset → sign-out check against staging.
3. Branch protection on `main` requiring the `verify`, `database`, and `e2e` checks.
4. Update GitHub Actions pins to Node 24-based majors (current pins emit deprecation warnings).
5. Remove the temporary `bootstrap/*` branches.

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
