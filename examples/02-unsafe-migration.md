# Example: Add required `format` column to `exports`

## Input diff (summary)

```sql
ALTER TABLE exports ADD COLUMN format TEXT NOT NULL;
```

```ts
// worker.ts
const format = exportRow.format.toUpperCase();
```

The migration and the worker change ship in the same deploy. No default
value is set on the column, and no backfill step is present.

## Output ledger

```
# Assumptions: Add required "format" column to exports

**Scope:** migrations/2026_07_add_format.sql, src/workers/worker.ts
**Overall risk:** High
**Release blockers:** 1

## Executive summary

The migration adds a NOT NULL column with no default and no backfill,
while the worker reads that column unconditionally in the same release.
During a rolling deploy, old worker instances and new worker instances
may run against schema states the other does not expect.

## Ledger

| Priority | Assumption | Evidence | If false | Current protection | Falsification test | Recommended action | Confidence |
|---|---|---|---|---|---|---|---|
| P0 | The migration fully completes, and all rows have a value, before any new worker code runs. | `ALTER TABLE ... NOT NULL` has no `DEFAULT`; worker.ts reads `exportRow.format` without a null check. | Migration failure on existing rows, or new worker code crashing if it runs before migration completion. | None found. | Run the migration against a table with existing rows and no default value. | Add a default value or a backfill step before enforcing NOT NULL; add a null check in the worker as a transition guard. | Verified |
| P1 | Old and new worker code never run concurrently against a schema the other does not expect. | No feature flag, versioned reader, or expand/contract pattern found around this column. | A rollback after partial rollout leaves old code running against a schema with a required column it never expected, or new code running before the column exists. | None found. | Deploy the worker change before the migration runs, and observe behavior. | Use an expand/contract migration: add nullable, backfill, deploy read-tolerant code, then enforce NOT NULL in a later release. | Likely |

## Existing safeguards

- None found in the reviewed scope.

## Required verification before release

- [ ] Confirm deployment platform's migration-then-code ordering guarantee.
- [ ] Add a backfill step or default value for existing rows.
- [ ] Add a null-safe read in the worker during the transition window.

## Unknowns and boundaries

- The deployment platform's exact ordering guarantee between migrations and
  application code rollout was not present in the analyzed scope.
```
