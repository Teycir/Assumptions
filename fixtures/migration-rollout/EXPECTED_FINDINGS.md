# Expected findings: migration-rollout

## P0 — NOT NULL column with no default breaks existing rows

- **Assumption:** The migration itself is compatible with the existing
  rows in `exports`.
- **Evidence:** `ALTER TABLE exports ADD COLUMN format TEXT NOT NULL;` has
  no `DEFAULT` clause and no accompanying backfill statement.
- **If false:** The migration itself fails outright against a table with
  existing rows, since Postgres/MySQL cannot satisfy NOT NULL on existing
  rows without a default.
- **Falsification test:** Run the migration against a seeded table with
  pre-existing rows and observe whether it succeeds.
- **Status:** Unprotected
- **Evidence confidence:** High

## P0 — Worker assumes migration has fully completed before it runs

- **Assumption:** New worker code remains safe before, during, and after
  the schema transition.
- **Evidence:** `worker.ts` reads `exportRow.format.toUpperCase()` with no
  null check or fallback.
- **If false:** If the worker's new code deploys before the migration
  finishes (or during a rollback), it throws on rows lacking the column
  or on a null value.
- **Falsification test:** Run the new worker code against the
  pre-migration schema (or a row where `format` is null) and observe the
  failure.
- **Status:** Unprotected
- **Evidence confidence:** High

## P1 — No expand/contract pattern for rollout/rollback safety

- **Assumption:** Both old and new writers can create valid `exports` rows
  throughout the rollout, and a partial rollback stays safe.
- **Evidence:** The column is both added and immediately required
  (NOT NULL) in a single migration, with no intermediate nullable phase.
- **If false:** A rollback of the worker code after the migration has run
  is safe (old code ignores the new column), but a rollback of the
  migration after the worker has shipped is not — the worker would start
  failing.
- **Falsification test:** Roll back the migration only, leaving the new
  worker code deployed, and observe worker behavior.
- **Status:** Unprotected
- **Evidence confidence:** Medium

## Non-findings

- The specific deployment platform's migration-then-code ordering
  guarantee is not present in this fixture and should be marked with an
  `Unknown` status, not assumed either way.
