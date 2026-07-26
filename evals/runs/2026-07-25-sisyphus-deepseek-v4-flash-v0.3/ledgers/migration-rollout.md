# Assumptions: fixtures/migration-rollout/

**Scope:** `migration.sql` + `worker.ts` — a NOT NULL column added with no default, and a worker reading that column.
**Overall risk:** High
**Release blockers:** 2

## Executive summary

Two independent release blockers exist here, both P0. First, the migration itself will fail against any non-empty `exports` table, since a NOT NULL column with no DEFAULT can't be satisfied for existing rows. Second — and separately, even if the migration is fixed or run against an empty table — the worker dereferences `exportRow.format` with no null check, so it will crash on any row from before the column existed or on a rollback window. These are two sides of the same rollout, not a root cause and a lesser side effect, and both block release.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | The migration succeeds against the current state of the `exports` table | `migration.sql:4` — `ALTER TABLE exports ADD COLUMN format TEXT NOT NULL;`, no DEFAULT, no backfill statement | The migration fails outright on any table with existing rows | Unprotected — no default or backfill found in `migration.sql` | Run the migration against a seeded table with pre-existing rows; observe failure | Add a DEFAULT, or split into nullable-add → backfill → SET NOT NULL | High |
| P0 | New worker code remains safe before, during, and after the schema transition | `worker.ts:6` — `exportRow.format.toUpperCase()`, no null check or fallback | Worker deployed before migration completes, or during/after a migration rollback, throws on any row missing `format` | Unprotected — no null check found in `worker.ts` | Run the new worker against the pre-migration schema, or a row with `format = NULL`; observe the crash | Add a null/undefined guard before `.toUpperCase()`, or gate the new worker behind confirmation that the migration has completed | High |
| P1 | Both old and new writers can produce valid `exports` rows throughout the rollout, and a partial rollback stays safe | `migration.sql` + `worker.ts` — the column is added and made NOT NULL in one step, no intermediate nullable phase (no expand/contract pattern) | Rolling back the migration alone (worker still deployed) leaves the worker crashing on the reverted schema; there's no safe intermediate state | Unprotected — no expand/contract phasing found in either file | Roll back the migration only, leaving the new worker deployed; observe worker behavior | Use expand/contract: add column nullable, backfill, deploy worker with null-tolerance, then add NOT NULL in a later migration | Medium — the phasing gap is directly visible, but the actual deploy/rollback ordering used in production isn't confirmed here |

## Existing safeguards

- None found in the reviewed scope (`migration.sql` and `worker.ts` only).

## Required verification before release

- [ ] Run the migration against a production-like non-empty dataset before shipping.
- [ ] Add a null guard in `worker.ts`.
- [ ] Confirm deploy ordering guarantees migration-before-worker, or add expand/contract phasing so ordering doesn't matter.

## Unknowns and boundaries

- The deployment platform's actual migration-then-code ordering guarantee is not shown in this fixture — marked Unknown, not assumed either way.
- Other consumers of `exports.format` beyond this worker were not reviewed.
