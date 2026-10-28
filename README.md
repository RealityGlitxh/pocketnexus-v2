# PocketNexus 2.0

An unofficial, fan-made competitive companion for **Pokémon TCG Pocket** — rebuilt from scratch.

> PocketNexus is not affiliated with, endorsed, sponsored, or approved by Nintendo, The Pokémon
> Company, Creatures Inc., GAME FREAK, or DeNA. Pokémon and Pokémon TCG Pocket are trademarks of
> their respective owners.

**Status: Phase 0 — foundation.** The app shell, design system, auth integration layer, and
database schema exist. Product features (cards, decks, battles, meta) are clearly-labelled
placeholders. See [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) for exactly what has
and hasn't been verified.

This repository is independent of the legacy V8 app (`RealityGlitxh/pocket-companion-beta`,
`beta.pocketnexus.app`) and never deploys to or reads from it.

## Stack

React 19 · TypeScript (strict) · Vite · Tailwind CSS v4 · React Router 7 · TanStack Query ·
Radix UI · Lucide · Supabase (Postgres, Auth, Storage, RLS) · Vitest · Testing Library ·
Playwright + axe · GitHub Actions · Cloudflare Pages.

## Quick start

Requirements: Node ≥ 22.12, pnpm 10 (`corepack enable`).

```bash
pnpm install
pnpm dev            # http://localhost:5173
```

The app runs without a backend — accounts show a clear "not connected" notice. To enable auth,
create `apps/web/.env.local` from [.env.example](.env.example) with a **development** Supabase
project (see [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md)).

## Commands

| Command                           | What it does                                                        |
| --------------------------------- | ------------------------------------------------------------------- |
| `pnpm dev`                        | Dev server                                                          |
| `pnpm build` / `pnpm preview`     | Production build / serve it on :4173                                |
| `pnpm typecheck`                  | `tsc` in every package                                              |
| `pnpm lint` / `pnpm format`       | ESLint (type-aware) / Prettier                                      |
| `pnpm test`                       | Vitest unit + component tests                                       |
| `pnpm test:e2e`                   | Playwright on desktop, tablet, mobile + axe accessibility scan      |
| `pnpm db:test`                    | Apply migrations to a throwaway local Postgres DB and run RLS tests |
| `pnpm check:bundle`               | Enforce gzip bundle budgets                                         |
| `pnpm check:secrets`              | Scan source and build output for leaked credentials                 |
| `node scripts/check-contrast.mjs` | Verify WCAG contrast of design tokens                               |
| `pnpm verify`                     | Everything CI runs except e2e and DB                                |

## Layout

```
apps/web            React app (routes, layouts, features, services)
packages/ui         Design tokens + UI primitives
packages/shared     Zod schemas, env validation, Result type
packages/database   Supabase schema types
supabase/           Migrations, config, dev seed, RLS tests
scripts/            CI guardrails
docs/               Architecture, design system, schema, security, deployment, roadmap
```

## Documentation

- [Product vision](docs/PRODUCT_VISION.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Design system](docs/DESIGN_SYSTEM.md)
- [Database schema](docs/DATABASE_SCHEMA.md)
- [Security](docs/SECURITY.md)
- [Deployment](docs/DEPLOYMENT.md)
- [Development roadmap & verification status](docs/DEVELOPMENT_ROADMAP.md)
- [Legacy inventory](docs/LEGACY_INVENTORY.md) · [Legacy archive plan](docs/LEGACY_ARCHIVE_PLAN.md) · [Migration strategy](docs/MIGRATION_STRATEGY.md)
