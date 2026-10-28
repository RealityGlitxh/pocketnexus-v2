# Deployment

## Environments

| Env | Frontend | Supabase | Trigger |
| --- | --- | --- | --- |
| development | `pnpm dev` (localhost:5173) | `pocketnexus-v2-dev` (`shodljlzwfsuouignvkv`) or local CLI stack | Manual |
| staging | Cloudflare Pages project `pocketnexus-v2-staging` → https://pocketnexus-v2-staging.pages.dev | `pocketnexus-v2-dev` (a separate staging project can replace it later) | CI on `main` → `deploy-staging.yml` |
| production | _Not configured in Phase 0_ | _Not configured_ | — |

**The legacy site `beta.pocketnexus.app` (GitHub Pages) and Supabase project
`cdmzrsvwztndqfwzsumo` are never targets.** The env validator refuses that project ref, the secret
scan fails the build if its URL appears, and the deploy workflow refuses any Pages project other
than `pocketnexus-v2-staging` and any Supabase URL containing the legacy ref.

## Current status (2026‑10‑28, Phase 0.3)

| Step | Status |
| --- | --- |
| GitHub repository | ✅ `RealityGlitxh/pocketnexus-v2` |
| Lockfile | ✅ pnpm 10.28.0; frozen install verified in CI |
| CI on `main` | ✅ See the latest run on the Actions tab |
| Deploy gate | ✅ Runs on every green `main` CI; skips with a notice until Cloudflare secrets exist |
| Cloudflare Pages project `pocketnexus-v2-staging` | ⏳ **Owner action** (§3) |
| Dev Supabase project | ✅ `pocketnexus-v2-dev`; 6 migrations; RLS verified on the hosted DB |
| Dev auth URL configuration | ⏳ **Owner action** (§2) |
| E2E test accounts + secrets | ⏳ **Owner action** (§4) |
| Authenticated E2E on staging | ❌ Not run yet (needs §2–§4) |

## One-time setup (owner)

### 1. Repository settings

GitHub → **Settings → Code security**: enable secret scanning, push protection, and Dependabot
alerts. Branch protection: see [§5](#5-recommended-branch-protection-for-main).

### 2. Supabase dev auth settings

Supabase dashboard → project `pocketnexus-v2-dev` → **Authentication**:

1. **URL Configuration**
   - Site URL: `https://pocketnexus-v2-staging.pages.dev`
   - Redirect URLs (add all four exactly):
     - `https://pocketnexus-v2-staging.pages.dev/auth/update-password`
     - `https://pocketnexus-v2-staging.pages.dev/`
     - `http://localhost:5173/auth/update-password`
     - `http://localhost:5173/`
2. **Sign In / Providers → Email**: Email provider enabled; "Confirm email" **on**;
   minimum password length **10**; password requirements **letters and digits**.
3. **Attack Protection**: enable leaked-password protection if your plan offers it.

Supabase's built-in email service only delivers to members of the Supabase organization and is
rate-limited (a few emails per hour). Use your own team email for the manual sign-up and
password-recovery checks, or configure custom SMTP before inviting testers.

### 3. Cloudflare Pages project (staging)

1. Cloudflare dashboard → **Workers & Pages → Create → Pages → Upload assets** (Direct Upload).
   Project name **`pocketnexus-v2-staging`**, production branch `main`. Upload any placeholder
   file to create it; CI replaces it on the first deploy. Do **not** connect it to Git — deploys
   come from GitHub Actions so only CI-verified commits are published.
2. **My Profile → API Tokens → Create token → Custom token**: permission
   **Account › Cloudflare Pages › Edit**, scoped to your account only. No zone or DNS permissions.
3. Note your **Account ID** (Workers & Pages overview, right sidebar).
4. GitHub → repo → **Settings → Secrets and variables → Actions**:
   - Secrets: `CLOUDFLARE_API_TOKEN`, `CLOUDFLARE_ACCOUNT_ID`
   - Variables (public values):
     - `STAGING_SUPABASE_URL` = `https://shodljlzwfsuouignvkv.supabase.co`
     - `STAGING_SUPABASE_PUBLISHABLE_KEY` = the dev project's `sb_publishable_…` key
     - `STAGING_SITE_URL` = `https://pocketnexus-v2-staging.pages.dev`
5. GitHub → **Settings → Environments → New environment** `staging` (optionally add yourself as a
   required reviewer).

The build command is `pnpm build` (runs `vite build` in `apps/web`), and the output directory is
`apps/web/dist`.

### 4. E2E test accounts (for the automated authenticated suite)

1. Supabase → **Authentication → Users → Add user → Create new user**, twice, with **Auto Confirm
   User** checked. Use dedicated test addresses you control, and generate strong unique
   passwords. These are **test accounts only**, never real users.
2. GitHub → **Settings → Secrets and variables → Actions → Secrets**: `E2E_USER_A_EMAIL`,
   `E2E_USER_A_PASSWORD`, `E2E_USER_B_EMAIL`, `E2E_USER_B_PASSWORD`.

The credentials never leave GitHub's secret store; the suite skips itself when they are absent.

### 5. Recommended branch protection for `main`

GitHub → **Settings → Rules → Rulesets → New branch ruleset** (or **Branches → Add rule**) for
`main`:

- Require a pull request before merging (1 approval once there is a second maintainer).
- Require status checks to pass, with "up to date before merging":
  `Lint, typecheck, unit tests, build`, `Migrations + RLS tests`,
  `Playwright (desktop, tablet, mobile)`.
- Block force pushes and deletions.
- Require linear history.
- Do not allow bypassing, except for repository admins in emergencies.

## What a deploy does

1. **Gate** (no secrets): continues only if Cloudflare secrets exist, CI succeeded for this exact
   commit on a push to `main` of this repository, and the commit is still the tip of `main`.
2. **Build** with the staging variables; refuse missing values or the legacy Supabase project.
3. Write CSP headers, `version.json` (commit SHA), and a `Disallow: /` `robots.txt`; secret scan.
4. `wrangler pages deploy apps/web/dist --project-name=pocketnexus-v2-staging --branch=main`.
5. **Verify** both the per-deployment URL and https://pocketnexus-v2-staging.pages.dev serve the
   exact SHA, deep links, the CSP header, and `robots.txt`.
6. **Playwright** against the live site: the full shell and accessibility suite on desktop,
   tablet, and mobile, plus the authenticated suite when the test-account secrets exist.

## Build-time headers

`scripts/write-headers.mjs` fills the Supabase origin into the CSP in `dist/_headers`.

## Rollback

Cloudflare Pages keeps every deployment; roll back from the dashboard (Deployments → _Rollback_).
Database migrations are forward-only; write a new migration to revert schema changes.
