# Architecture

## Overview

```
pocketnexus-v2/                pnpm workspace monorepo
├── apps/web                   React 19 SPA (Vite, React Router 7 data router, TanStack Query)
├── packages/ui                Design tokens + accessible UI primitives (Radix + Tailwind v4)
├── packages/shared            Zod schemas, env validation, Result type, constants (no React)
├── packages/database          TypeScript types for the Supabase schema (no runtime code)
├── supabase/                  SQL migrations, local config, dev seed, RLS test suite
├── scripts/                   CI guardrails (contrast, bundle budget, secret scan, headers)
└── .github/workflows          CI + staging deploy
```

**Dependency direction (enforced by convention + ESLint):**

```
apps/web ──▶ packages/ui ──▶ (react, radix, lucide)
   │  └────▶ packages/shared ──▶ zod
   └───────▶ packages/database (types only)
```

`packages/*` never import from `apps/*`. `ui` does not know about routing, auth, or data.

## Stack decisions

| Choice | Why | Trade-off |
| --- | --- | --- |
| **React + TypeScript strict** (`noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`) | Catches whole classes of V8 regressions at compile time | More verbose types |
| **Vite** | Fast dev server, Rollup builds, native code splitting | — |
| **Tailwind v4 + CSS-variable tokens** | One token source; semantic utilities; tiny CSS | Utility-class verbosity; mitigated by `cva` variants in `ui` |
| **Radix primitives** for Dialog/Dropdown/Tabs/Toast | Correct focus management and ARIA out of the box | +~25 kB gz across lazily-used chunks |
| **React Router 7 data router** with `lazy` routes | Per-route code splitting, route-level error boundaries | — |
| **TanStack Query** | Caching, dedupe, retries; user-scoped keys purgeable on sign-out | — |
| **Supabase** (Postgres + Auth + Storage + RLS) | Same vendor as V8 (team familiarity); RLS keeps authorization in the DB | Vendor coupling; mitigated by service layer |
| **pnpm workspaces, no Turborepo/Nx** | Enough for 1 app + 3 packages; zero extra tooling | Add Turborepo only if build times demand it |
| **Source-only internal packages** (exports point at `.ts`) | No package build step; Vite compiles them | Packages can't be published as-is (not a goal) |

No stack changes from the brief were made.

## Module boundaries (apps/web)

```
src/
├── app/          Providers, theme, query client — app-wide wiring only
├── routes/       Route table (lazy) + navigation config
├── layouts/      AppShell (sidebar/topbar/drawer), AuthLayout
├── components/   App-specific shared components (PageHeader, PlaceholderPage, error boundaries)
├── features/<x>/ One folder per product area; public API = index.ts(x)
├── services/     Typed data access (auth, profile). Returns Result<T>, never throws raw errors
├── lib/          env parsing, Supabase client factory
├── pages/        Route-level pages that don't belong to a feature (404)
└── styles/       Tailwind entry + base layer
```

Rules:

1. **Features import other features only through their `index`** (ESLint `no-restricted-imports`).
   The route table is the single place that deep-imports pages, and only via dynamic `import()`.
2. **No feature initialises another.** Each route chunk loads its own code; the dashboard does not
   load the card catalog, Deck Lab, or the Supabase SDK unless needed.
3. **UI never talks to Supabase directly.** Components call `services/*`, which validate input with
   shared zod schemas and map errors to safe messages.
4. **User-scoped query keys start with `['user', userId, …]`** so sign-out purges them.

## Runtime flow

1. `index.html` → tiny `theme-init.js` (no flash of wrong theme) → `main.tsx`.
2. `Providers`: QueryClient → Theme → Toast → Auth.
3. `AuthProvider` reads validated env. If Supabase isn't configured → state `disabled` and **the SDK
   is never downloaded**. Otherwise it lazy-loads supabase-js and subscribes to auth events.
4. `RouterProvider` renders `AppShell`; each page chunk loads on navigation behind a skeleton.

## Error handling

- `AppErrorBoundary` around the whole app (safe message + reload).
- `RouteErrorBoundary` per route group: one broken page never blanks the shell; detects stale-chunk
  errors after a deploy and offers a reload.
- Services return `Result<T, AppError>` with pre-written, user-safe messages.

## Performance budgets

Enforced by `scripts/check-bundle-budget.mjs` in CI (gzip):

| Budget | Limit | How measured |
| --- | --- | --- |
| Initial JS (entry + modulepreloads) | ≤ 170 kB | Parsed from `dist/index.html` |
| Any lazy chunk | ≤ 80 kB | Every other `.js` in `dist/assets` |
| Total CSS | ≤ 30 kB | All `.css` |

Planned runtime budgets (Phase 1, Lighthouse CI on staging, mobile profile): LCP ≤ 2.5 s,
CLS ≤ 0.1, INP ≤ 200 ms, TBT ≤ 200 ms.

Additional rules: route-level splitting; list views > 200 rows use `@tanstack/react-virtual`; all
catalog queries are server-paginated (`max_rows = 500` at the API); images lazy-load with explicit
dimensions.

**Status:** budgets are defined and scripted but have **not yet been measured** because the build
could not be run in the Phase 0 environment (see DEVELOPMENT_ROADMAP.md → Verification status).
