#!/usr/bin/env bash
# Applies all migrations to a throwaway database on a plain PostgreSQL server
# (with a minimal Supabase shim) and runs the RLS test suite.
#
# Usage:
#   PGHOST=localhost PGUSER=postgres PGPASSWORD=postgres bash supabase/tests/run-local-postgres.sh
#
# Never point this at a real Supabase project: it CREATES and DROPS a database.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/../.." && pwd)"
DB="pocketnexus_test_$$"

case "${PGHOST:-localhost}" in
  localhost|127.0.0.1|postgres|/var/run/postgresql*) ;;
  *) echo "Refusing to run against non-local host '${PGHOST}'." >&2; exit 2 ;;
esac

cleanup() { dropdb --if-exists "$DB" >/dev/null 2>&1 || true; }
trap cleanup EXIT

createdb "$DB"
PSQL=(psql -X -q -v ON_ERROR_STOP=1 -d "$DB")

echo "== Applying Supabase shim"
"${PSQL[@]}" -f "$ROOT/supabase/tests/00_supabase_shim.sql"

echo "== Applying migrations"
for f in "$ROOT"/supabase/migrations/*.sql; do
  echo "   $(basename "$f")"
  "${PSQL[@]}" -f "$f"
done

echo "== Re-applying migrations must fail cleanly (no silent duplicates)"
if "${PSQL[@]}" -f "$ROOT/supabase/migrations/20261028123549_catalog.sql" >/dev/null 2>&1; then
  echo "ERROR: migration 0200 re-applied without error; migrations must not be silently idempotent over existing tables" >&2
  exit 1
fi

echo "== Running RLS tests"
"${PSQL[@]}" -f "$ROOT/supabase/tests/10_rls_policies.sql" 2>&1 | sed -n 's/^.*NOTICE:  //p; /ALL PASSED/p; /ERROR/p'

echo "== Applying local dev seed (must be idempotent)"
"${PSQL[@]}" -f "$ROOT/supabase/seed/seed.sql"
"${PSQL[@]}" -f "$ROOT/supabase/seed/seed.sql"
echo "== Database tests passed"
