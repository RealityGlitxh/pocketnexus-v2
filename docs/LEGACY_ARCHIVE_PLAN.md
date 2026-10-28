# Legacy Archive Plan — PocketNexus V8

**Status: PLAN ONLY. No step below has been executed.** Every destructive or infrastructure-changing
step requires explicit written approval from the project owner before it is run.

## Principles

- V8 at `beta.pocketnexus.app` stays **online and unchanged** until V2 reaches feature parity for
  the features users rely on and a cut-over is approved.
- A backup is not a backup until it has been **restored and verified**.
- Archive = make read-only and preserved; never delete.

## Phase A — Freeze and capture (safe, read-only) — _awaiting owner_

| #   | Step                                                                                                                                                                                             | Who                          | Destructive? |
| --- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------------------------- | ------------ |
| A1  | Tag the current V8 head: `git tag v8-final-<date>` and push the tag                                                                                                                              | Owner                        | No           |
| A2  | Download a full repository archive (`git bundle create v8.bundle --all`) and store it off-GitHub                                                                                                 | Owner                        | No           |
| A3  | `supabase db dump --schema-only` and `--data-only` from `cdmzrsvwztndqfwzsumo`; store encrypted                                                                                                  | Owner (needs DB credentials) | No           |
| A4  | Export Storage buckets `profile-media`, `team-ranked-evidence`                                                                                                                                   | Owner                        | No           |
| A5  | Download source of **all** deployed Edge Functions (`supabase functions download <name>`), especially `meta-import`, `meta-live`, `meta-snapshot`, `rank-border-live`, which are not in the repo | Owner                        | No           |
| A6  | Record Auth settings (providers, redirect URLs, email templates), Pages settings, DNS records                                                                                                    | Owner                        | No           |

## Phase B — Verify the backup — _awaiting owner_

| #   | Step                                                                                                |
| --- | --------------------------------------------------------------------------------------------------- |
| B1  | Create a **scratch** Supabase project (never production).                                           |
| B2  | Restore the A3 dumps; confirm row counts per table match production counts taken at dump time.      |
| B3  | Spot-check 10 users end-to-end (profile, decks, matches) in the restored copy.                      |
| B4  | Document results in this file with dates and counts. Only after B4 passes is the backup "verified". |

## Phase C — Archive (requires explicit approval; not before V2 cut-over)

| #   | Step                                                                                       | Reversible?                          |
| --- | ------------------------------------------------------------------------------------------ | ------------------------------------ |
| C1  | Add an in-app banner on V8 announcing V2 (code change to V8 — **owner approval required**) | Yes                                  |
| C2  | Disable the hourly `meta-refresh.yml` cron once V2 ingestion replaces it                   | Yes                                  |
| C3  | Point DNS for the chosen V2 hostname to Cloudflare Pages (owner decides hostnames)         | Yes                                  |
| C4  | Mark `pocket-companion-beta` **archived** on GitHub (read-only, not deleted)               | Yes                                  |
| C5  | Pause (not delete) the legacy Supabase project after the retention window                  | Yes (within Supabase's pause limits) |

**Explicitly out of scope at all times:** deleting the repository, deleting the Supabase project,
deleting user accounts, or modifying production DNS without approval.

## Retention

Keep the verified backup (A2–A5) for at least 12 months after cut-over, or longer if required by
the privacy policy in force at the time.
