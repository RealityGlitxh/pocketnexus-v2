# Legacy Inventory — PocketNexus V8

**Source inspected:** `RealityGlitxh/pocket-companion-beta` (public), shallow clone of `main` at
commit `d729ac4` ("chore(ui2): refresh competitive workspace assets", 2026‑10‑04).
**Method:** read-only static inspection of the repository on 2026‑10‑28. Nothing was pushed,
modified, or deployed.

**Not inspected (no access from the build environment):**

- The live site `https://beta.pocketnexus.app/` (outbound fetch was blocked).
- The Supabase project `cdmzrsvwztndqfwzsumo` (no credentials; intentionally not requested).
- Deployed Edge Function source that is not in the repository (see §6).
- GitHub repository settings, Pages settings, secrets, and Actions run history.

Everything below about the database is **inferred from client code** and must be confirmed against
the live project before any migration work.

---

## 1. Framework and dependencies

| Aspect        | Finding                                                                                                                         |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------- |
| Build system  | **None.** Plain static site: `index.html` + 60 `<script defer>` tags + 14 stylesheets. No `package.json`, bundler, or lockfile. |
| Language      | Untyped browser JavaScript (≈1.9 MB across 120 files; several files exceed 100 kB, `js/data/meta-data.js` is 240 kB).           |
| CSS           | 50+ files (≈3,800 lines), most named after the patch that introduced them (`*-hotfix-v8.64.1.css`, `pass3b-*.css`, `ui2-*`).    |
| Runtime deps  | `@supabase/supabase-js@2` loaded unpinned from jsDelivr (`…/supabase-js@2`) and esm.sh in edge functions.                       |
| PWA           | `sw.js` service worker (cache `v8.65.1-branding-hotfix2`), `manifest.webmanifest`, `offline.html`.                              |
| Cache busting | Manual `?v=864217`-style query strings per script.                                                                              |

## 2. Application modules

Identified from `js/app`, `js/features`, `js/core`, `js/services`, and the 11 HTML entry points:

- **Home / command center** (`home.js`, `home-command-center-v8.75.0.js`)
- **Card database & collection** (`collection.js`, `card-service.js`, card enrichment services)
- **Deck builder & deck manager** (`decks_meta.js`, `deck-builder-unrestricted-v8.72.5.js`, `deck-public.html`)
- **Battle tracker / gym / performance** (`battle_gym.js`, `performance.js`, `battle-streamer-v8.43.js`)
- **Meta & tournaments** (`meta-service.js`, `tournament-service.js`, `tournament-leaderboards-v8.31.js`)
- **Rank tracking & seasons** (`rank_tools-v8.64.1.js`, `rank-runtime-core`, `rank-session-service.js`)
- **Profiles, teams, Team Wars, Team Ranked** (`profile_teamwars.js`, many `team_*` tables)
- **Training / daily challenges / achievements** (`training.js`, `training-adaptive-brain-v8.68.5.js`)
- **Pocket Coach (AI)** (`ai_coach.js`, `supabase/functions/pocket-coach`, OpenAI)
- **Streamer tools & OBS overlays** (≈25 `streamer-*` files, `overlay*.html`, remote transport)
- **Pocket Sync** (import/sync adapters, `pocket_sync_*` tables)
- **Local backup/restore**, What's New, PWA auto-update

## 3. Database tables and relationships

**54 distinct tables** are referenced via `.from()` and **58 RPC functions** via `.rpc()`. Only
**5 tables** have `CREATE TABLE` statements anywhere in the repository:
`game_knowledge`, `profile_session_posts`, `stream_overlay_sessions`,
`team_ranked_dispute_evidence`, `training_profile_showcase`.

The remaining ~49 tables (e.g. `profiles`, `cloud_decks`, `cloud_matches`, `cloud_collection`,
`cloud_rank_history`, `cloud_preferences`, `cloud_sync_state`, `teams`, `team_members`,
`team_wars`, `team_ranked_*`, `meta_*`, `competitive_events`, `simulation_*`, `ai_conversations`,
`ai_messages`, `pocket_sync_*`, `rank_seasons`, `rank_thresholds`, …) exist only in the live
database. Their columns, constraints, indexes, and RLS policies are **unknown** from source.

Schema SQL in the repo is spread across root-level files (`V8.60.2_DB_MIGRATION.sql`,
`V8.64.1_*.sql`, `V8.64.2_POCKET_KNOWLEDGE_ENGINE.sql`, …) plus 3 files in
`supabase/migrations/`. There is no single ordered migration history.

Relationships visible in code (unverified): most user tables are keyed by the auth user id;
`team_members → teams`; `team_ranked_*` reference teams and matches; `meta_snapshot_*` reference
`meta_snapshots`; `ai_messages → ai_conversations`.

## 4. Authentication architecture

- Supabase Auth via supabase-js in the browser.
- Methods: email + password (`signUp`, `signInWithPassword`), password reset
  (`resetPasswordForEmail`, `updateUser`), OAuth with **Google** and **Apple**.
- Session handled by supabase-js defaults (`getSession`, `onAuthStateChange`).
- A **publishable** key (`sb_publishable_…`) is embedded in 7 client files — this is expected and
  safe. **No service-role or secret key was found in client code.** ✅
- Edge functions read `SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_SECRET_KEYS`, `OPENAI_API_KEY`,
  `OPENAI_MODEL` from Deno env (server-side, appropriate).

## 5. Storage dependencies

- Bucket `profile-media` (avatars/banners; public URLs via `getPublicUrl`).
- Bucket `team-ranked-evidence` (dispute screenshots; signed URLs, 15-minute expiry).
- Browser `localStorage` (9 keys) for preferences, drafts, and offline state; local backup/restore
  exports these as JSON.

## 6. External API integrations

| Integration                                               | Use                                           | Risk                                                          |
| --------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------- |
| `play.limitlesstcg.com` (360 references)                  | Tournament, standings, decklists, live tables | Terms of use / scraping permission unverified; heavy coupling |
| `limitlesstcg.nyc3.cdn.digitaloceanspaces.com`            | Card images                                   | Hotlinking third-party assets                                 |
| `cdn.jsdelivr.net/npm/pokemon-tcg-pocket-database`        | Card catalog JSON                             | Unpinned version; licence unverified                          |
| `raw.githubusercontent.com/R4PH1/PTCGP-Data`              | Card enrichment                               | Third-party repo, unpinned, licence unverified                |
| `pokemon-zone.com`                                        | Card enrichment source                        | Terms unverified                                              |
| `api.openai.com`                                          | Pocket Coach (server-side)                    | Cost / abuse controls not reviewed                            |
| `api.qrserver.com`                                        | QR codes for overlays                         | Leaks overlay URLs to a third party                           |
| `cdn.jsdelivr.net/gh/RealityGlitxh/pocket-companion-beta` | Serves the repo itself via CDN                | Any pushed file is publicly cached                            |

Edge functions **called** by the client or CI: `limitless-refresh`, `meta-import`, `meta-live`,
`meta-snapshot`, `pocket-coach`, `rank-border-live`. Only `limitless-refresh`,
`limitless-tournament-proxy`, and `pocket-coach` have source in the repo — **`meta-import`,
`meta-live`, `meta-snapshot`, and `rank-border-live` are deployed without versioned source.**

## 7. Deployment configuration

- `CNAME` = `beta.pocketnexus.app` → served by **GitHub Pages** from this repository.
- No build step; whatever is on the default branch is the deployment.
- `meta-refresh.yml` runs **hourly** and POSTs to three production edge functions **without an
  auth header**, implying those functions are publicly invocable (`verify_jwt = false`).

## 8. Existing tests

- 73 GitHub Actions workflow files, the majority one-off QA or "apply patch" jobs tied to specific
  versions (e.g. `apply-pocket-coach-before-after-v3.yml`).
- 18 scripts in `qa/` (Playwright/Puppeteer-style browser checks, `.cjs`/`.mjs`).
- No unit tests, no type checking, no lint configuration, no single CI gate.
- Extensive manual QA notes (`V8.65_RC1_TEST_MATRIX.md`, `V8.65_RC1_DEVICE_RESULTS.md`).

## 9. Known technical risks

1. **Schema drift:** ~90% of tables have no versioned DDL; the live DB is the only source of truth.
2. **Unversioned server code:** four called edge functions have no source in the repo.
3. **Public, unauthenticated mutation endpoints** invoked by cron (`force: true` imports).
4. **Global script coupling:** 60 deferred scripts sharing globals; load order is load-bearing; the
   documented hotfix history (e.g. "route class leakage", "render guard", "recursive duplicate
   fetches") is symptomatic.
5. **Patch layering:** CSS/JS hotfix files override earlier files rather than replacing them.
6. **177 `innerHTML` writes** — XSS exposure wherever user/remote data is interpolated (not audited
   line by line).
7. **Unpinned CDN dependencies** (`supabase-js@2`, card database) — a breaking upstream release
   changes production behaviour without a deploy.
8. **Third-party data licensing** not documented for Limitless, PTCGP-Data, Pokémon Zone.
9. **Service worker cache identity** managed by hand — stale clients were a recurring repair item.
10. **Single environment:** no separate staging; `main` is production.

## 10. Potential migration requirements

See [MIGRATION_STRATEGY.md](./MIGRATION_STRATEGY.md). In short, before any data moves:

- Export the live schema (`supabase db dump --schema-only`) and RLS policies — read-only.
- Take and **test-restore** a full backup into a scratch project.
- Map user-owned tables (`profiles`, `cloud_decks`, `cloud_matches`, `cloud_preferences`,
  `cloud_collection`, `cloud_rank_history`) to V2 tables.
- Decide auth strategy: same Supabase project's `auth.users` vs. migrating users to a new project
  (password hashes can be migrated by Supabase support/tooling; OAuth identities must be re-linked).
- Re-evaluate every external data source's terms before re-ingesting.
