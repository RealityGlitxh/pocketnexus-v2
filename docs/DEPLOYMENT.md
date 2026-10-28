# Deployment

## Environments

| Env         | Frontend                                                    | Supabase                                                         | Trigger                             |
| ----------- | ----------------------------------------------------------- | ---------------------------------------------------------------- | ----------------------------------- |
| development | `pnpm dev` (localhost:5173)                                 | Local CLI stack (`supabase start`) **or** a hosted _dev_ project | Manual                              |
| staging     | Cloudflare Pages project `pocketnexus-v2`, branch `staging` | Hosted **staging** project                                       | CI on `main` → `deploy-staging.yml` |
| production  | Same Pages project, production branch                       | Hosted **production** project                                    | _Not configured in Phase 0_         |

**The legacy site `beta.pocketnexus.app` (GitHub Pages) and Supabase project
`cdmzrsvwztndqfwzsumo` are never targets.** The env validator refuses that project ref, the secret
scan fails the build if its URL appears, and the deploy workflow refuses any Pages project name
other than `pocketnexus-v2`.

## Current status

| Step                                                     | Status (2026‑10‑28, Phase 0.2)                                                                                                                                                                                                                         |
| -------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| GitHub repository `pocketnexus-v2`                       | ✅ `RealityGlitxh/pocketnexus-v2`                                                                                                                                                                                                                      |
| Lockfile (`pnpm-lock.yaml`)                              | ✅ Generated on a GitHub runner with pnpm 10.28.0; frozen install verified                                                                                                                                                                             |
| CI workflow                                              | ✅ Runs on GitHub; see DEVELOPMENT_ROADMAP.md for results                                                                                                                                                                                              |
| Deploy gate                                              | Logic executed locally against 8 simulated scenarios — all correct                                                                                                                                                                                     |
| Cloudflare Pages project                                 | **Not created** — needs owner's Cloudflare account                                                                                                                                                                                                     |
| Staging deploy                                           | **Not deployed; no URL exists to verify**                                                                                                                                                                                                              |
| Dev Supabase project                                     | ✅ **Created** `pocketnexus-v2-dev` (ref `shodljlzwfsuouignvkv`, us-east-2, org PocketNexusV2, free plan) — 6 migrations applied; full RLS suite passed on the hosted DB inside a rolled-back transaction; advisor findings reviewed (all intentional) |
| Dev auth settings (site URL, redirects, password policy) | ⏳ **Owner action** — no tool available to set them; see §2                                                                                                                                                                                            |
| Sign-up / login / logout / recovery against dev          | ❌ **Not tested** — the sandbox cannot reach `*.supabase.co`, and there is no deployed app yet                                                                                                                                                         |

## One-time setup (owner)

### 1. Repository

```bash
cd pocketnexus-v2
pnpm install                         # generates pnpm-lock.yaml
pnpm verify                          # format, lint, typecheck, test, build, budgets, secret scan
git add -A && git commit -m "Phase 0 foundation"
gh repo create <owner>/pocketnexus-v2 --private --source=. --push
```

Then in GitHub → Settings: enable **secret scanning + push protection**, **Dependabot alerts**,
and branch protection on `main` requiring the `CI` checks.

### 2. Development Supabase project

1. Create a **new** project (e.g. `pocketnexus-v2-dev`). Do not reuse the V8 project.
2. `supabase link --project-ref <dev-ref>` then `supabase db push` to apply migrations.
3. Auth → URL configuration: Site URL `http://localhost:5173`; redirect URLs
   `http://localhost:5173/auth/update-password`, and the staging equivalents.
4. Auth → enable leaked-password protection; set minimum password length 10.
5. Copy URL + **publishable** key into `apps/web/.env.local`:
   ```
   VITE_APP_ENV=development
   VITE_SUPABASE_URL=https://<dev-ref>.supabase.co
   VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
   VITE_SITE_URL=http://localhost:5173
   ```
6. `pnpm dev`, create an account, confirm the email, sign in, open **Profile** → your username
   loads from `public.profiles`. Only then mark authentication "verified".

### 3. Cloudflare Pages (staging)

1. Cloudflare → Workers & Pages → Create → Pages → _Direct Upload_ → name **`pocketnexus-v2`**.
2. Create an API token with **Account › Cloudflare Pages › Edit** only.
3. GitHub repo → Settings → Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`.
4. GitHub repo → Settings → Variables: `STAGING_SUPABASE_URL`,
   `STAGING_SUPABASE_PUBLISHABLE_KEY`, `STAGING_SITE_URL` (public values only).
5. Create a GitHub environment `staging` (optionally with required reviewers).
6. Push to `main` → CI → `Deploy staging`. The `gate` job deploys only if CI succeeded for that
   exact commit on a push to `main` and it is still the tip of `main`. After deploying, the
   workflow fetches `<url>/version.json` and fails unless it reports the deployed SHA; it also
   checks a deep link, the CSP header, and `robots.txt`. Staging is "verified" only after that step
   is green **and** a human has signed up / signed in on it.
7. Branch protection on `main`: require the `verify`, `database`, and `e2e` checks.
8. Optional custom domain (e.g. `next.pocketnexus.app`) — **owner decision**; adding it must not
   alter the existing `beta` record.

## Build-time headers

`scripts/write-headers.mjs` fills the Supabase origin into the CSP in `dist/_headers`. Staging
builds also replace `robots.txt` with `Disallow: /`.

## Rollback

Cloudflare Pages keeps every deployment; roll back from the dashboard (Deployments → _Rollback_).
Database migrations are forward-only; write a new migration to revert schema changes.
