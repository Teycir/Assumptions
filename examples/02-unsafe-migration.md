# Example: Add required `format` column to `exports`

## Input diff (summary)

```sql
-- migrations/2026_07_add_format.sql, line 1
ALTER TABLE exports ADD COLUMN format TEXT NOT NULL;
```

```ts
// src/workers/worker.ts, line 12
const format = exportRow.format.toUpperCase();
```

The migration and the worker change ship in the same deploy. No default
value is set on the column, and no backfill step is present. The `exports`
table already has rows (confirmed via existing seed/test fixtures).

## Output ledger

```
# Assumptions: Add required "format" column to exports

**Scope:** migrations/2026_07_add_format.sql, src/workers/worker.ts
**Overall risk:** High
**Release blockers:** 2

## Executive summary

The migration adds a NOT NULL column with no default and no backfill on a
table that already has rows — this makes the migration itself fail
immediately on apply, before any rollout-ordering question even arises.
Separately, once a working migration exists, old and new worker code may
still run concurrently against schema states the other doesn't expect
during a rolling deploy.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | The migration itself is compatible with the existing rows in `exports`. | `migrations/2026_07_add_format.sql:1` adds `format TEXT NOT NULL` with no `DEFAULT`; fixtures show `exports` already has rows. | Most databases reject a `NOT NULL` column addition with no default on a populated table — the migration fails on apply, before the application even deploys. | Unprotected — no default value or backfill step found in the migration file. | Run the migration against a copy of the database with existing `exports` rows and observe whether it succeeds. | Add a `DEFAULT` value, or split into an expand/contract migration: add nullable, backfill existing rows, then enforce `NOT NULL` in a later migration. | High |
| P1 | Both old and new application code can create valid `exports` rows throughout the rollout. | `src/workers/worker.ts:12` reads `exportRow.format` with no null check; no evidence in the reviewed scope of the old writer path being updated to supply `format`. | If the migration is fixed and applied first, old application instances that don't yet set `format` on insert can fail or insert invalid data while old and new versions coexist during a rolling deploy. | Unknown — whether the write path (insert code) was updated to always supply `format` was not present in the reviewed scope; only the migration and one read site were inspected. | Run the old application version's insert path against the migrated schema and attempt to create an export. | Confirm the insert path always supplies `format` before the column is enforced as required, or add a temporary default. | Medium |
| P1 | New worker code remains safe if it runs before the migration has been applied. | `src/workers/worker.ts:12` reads `exportRow.format` without a null/undefined check. | If new worker code deploys before the migration completes, reading `exportRow.format` on pre-migration rows throws or returns `undefined`. | Unprotected — no null check found at `src/workers/worker.ts:12`. | Deploy the worker change against the pre-migration schema and observe behavior when processing an existing row. | Add a null-safe read in the worker as a transition guard, or enforce migration-before-deploy ordering at the platform level. | High |

## Existing safeguards

- None found in `migrations/2026_07_add_format.sql` or `src/workers/worker.ts`.

## Required verification before release

- [ ] Add a default value or backfill step so the migration succeeds on a populated table.
- [ ] Confirm the insert/write path supplies `format` before or as part of this rollout.
- [ ] Add a null-safe read in the worker during the transition window.
- [ ] Confirm deployment platform's migration-then-code ordering guarantee.

## Unknowns and boundaries

- The deployment platform's exact ordering guarantee between migrations and
  application code rollout was not present in the analyzed scope.
- Whether any write path other than the one reviewed inserts into `exports`
  was not confirmed.
```
