# Security

This document describes controls that **exist in the code today** and what is still outstanding.
Passing CI does not mean the application is secure; it means these specific checks pass.

## Controls implemented

### Secrets and configuration
- Browser code may only receive `VITE_*` values: Supabase URL, **publishable** key, site URL, env name.
- `parseClientEnv` (shared, unit-tested) **rejects** at startup: `sb_secret_…` keys, JWTs whose
  role is `service_role`, and the legacy production project ref `cdmzrsvwztndqfwzsumo`. An
  invalid config disables auth with a visible notice instead of connecting.
- `.env*` files are git-ignored; only `.env.example` (no values) is tracked.
- `scripts/check-no-secrets.mjs` scans tracked files **and the built bundle** for secret keys,
  service-role JWT assignments, DB URLs with passwords, OpenAI/GitHub tokens, private keys, and the
  legacy project URL. Verified to catch a planted key.

### Authentication
- Supabase Auth only — no custom password storage.
- PKCE flow, session persisted by supabase-js, auto refresh, refresh-token rotation (config.toml).
- Password policy ≥ 10 chars with letters + digits (client zod schema and `config.toml`).
- **No account enumeration:** sign-up and password-reset return the same UI whether or not the
  address exists.
- **Open-redirect protection** on post-login return paths (`safeReturnPath`, tested against
  `//host`, absolute URLs, and backslash tricks).
- Raw Supabase error text is never shown; codes map to pre-written messages.
- **User-scoped cache isolation:** all user queries use keys `['user', userId, …]` and are purged
  whenever the signed-in identity changes — sign-out *or* a different account appearing (e.g. from
  another tab) without an intervening `SIGNED_OUT`. Token refreshes keep the cache. Covered by
  `authTransitions.test.ts` (executed) and `AuthProvider.test.tsx` (written).
- Reset links (PKCE) work only in the browser that requested them; the expired-link page says so.
  Password changes without a fresh recovery session surface Supabase's `reauthentication_needed`
  as a safe, actionable message.

### Authorization (database)
- RLS enabled on **every** table in `public`, `catalog`, `ingest` (asserted by tests).
- Column-level UPDATE grants: clients cannot change `id`, `owner_id`, `created_at`, `updated_at`.
- No client INSERT on profiles; created by a SECURITY DEFINER trigger.
- `catalog` read-only to clients; `ingest` invisible to clients.
- All SECURITY DEFINER functions pin `search_path` (asserted by tests); internal trigger functions
  have EXECUTE revoked from API roles.
- Storage uploads limited to the user's own folder, size- and MIME-restricted.
- 41 automated RLS/privilege assertions (see DATABASE_SCHEMA.md).

### Browser hardening (Cloudflare `_headers`)
- CSP: `default-src 'self'`; `script-src 'self'` (no inline scripts — the theme bootstrap is an
  external file); `connect-src` limited to self + the environment's Supabase origin;
  `frame-ancestors 'none'`; `object-src 'none'`.
- `X-Content-Type-Options`, `X-Frame-Options: DENY`, `Referrer-Policy`, `Permissions-Policy`,
  COOP, HSTS.
- React escapes output by default; **no `dangerouslySetInnerHTML`** anywhere in V2.

### CI/CD
- Staging deploys only a commit whose **CI run (all three jobs) succeeded on a push to `main` of
  this repository**, and only if it is still the tip of `main`. The `gate` job holds no secrets.
- `workflow_run` events from pull requests or forks are rejected — the `branches` filter alone
  matches head-branch *names*, which a fork controls (a classic secret-exfiltration vector).
- Manual deploys re-verify CI success for the exact SHA through the GitHub API.
- The deployed URL is verified to serve the exact commit (`/version.json`), SPA deep links, the CSP
  header, and staging `robots.txt` before the run passes.
- All third-party actions are pinned to commit SHAs; checkouts don't persist credentials.

### Supply chain
- Lockfile + `--frozen-lockfile` in CI; `pnpm audit --audit-level high` in CI; Dependabot weekly.
- `onlyBuiltDependencies` allow-list limits install scripts to esbuild and Tailwind's oxide.
- Fonts self-hosted; no third-party runtime CDNs (unlike V8's unpinned jsDelivr imports).

## Known gaps / outstanding

| Item | Status |
| --- | --- |
| `style-src 'unsafe-inline'` in CSP (Radix sets inline positioning styles) | Accepted for now; revisit with nonces |
| Supabase Auth rate limits, CAPTCHA (Turnstile) on sign-up | Configure on the hosted project (Phase 1) |
| Leaked-password protection (HaveIBeenPwned) in Supabase Auth | Enable on hosted project |
| MFA | Not implemented |
| Error reporting (Sentry or similar) with PII scrubbing | Not implemented |
| GitHub secret scanning + push protection, branch protection | Must be enabled when the repo is created |
| Penetration test / external review | Not done |
| Lockfile | **Not yet generated** (registry blocked in the build environment) — first install must commit it |
| Dependency audit | **Not run** — `pnpm audit` needs the lockfile and registry |
| Web/UI code never compiled or linted | Type/lint findings may exist; treat as unreviewed until `pnpm verify` passes |

## Legacy V8 findings (for the owner — not fixed here, V8 is out of scope)

- Hourly CI job calls production Edge Functions **without authentication** (`meta-import` with
  `force: true`); anyone can likely trigger these. Recommend `verify_jwt` + a shared secret.
- 177 `innerHTML` assignments in V8 client code — potential XSS where remote/user data is
  interpolated.
- Unpinned `@supabase/supabase-js@2` from jsDelivr.
- QR codes generated by `api.qrserver.com` disclose overlay URLs to a third party.

## Reporting

Until a public contact exists, report vulnerabilities privately to the repository owner via GitHub
Security Advisories on the V2 repository.
