# Assumptions: fixtures/migration-rollout/

**Scope:** `fixtures/migration-rollout/migration.sql` + `fixtures/migration-rollout/worker.ts` — a migration adding a NOT NULL column without a default, and a worker that reads it.
**Overall risk:** High
**Release blockers:** 1

## Executive summary

The migration `ALTER TABLE exports ADD COLUMN format TEXT NOT NULL` will fail on any non-empty `exports` table because PostgreSQL requires a default value to populate existing rows when adding a NOT NULL column. The worker code assumes the column exists and is always non-null, but this is only true if the migration succeeds and no deployment window exists where old code writes rows without `format`. The migration itself is the primary risk: it will block deployment on any production database with existing export rows.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | The `exports` table is empty when the migration runs, or the migration tooling handles NOT NULL column addition on non-empty tables. | `migration.sql:4` — `ALTER TABLE exports ADD COLUMN format TEXT NOT NULL` has no `DEFAULT` value. PostgreSQL requires existing rows to have a value; without a DEFAULT, the statement fails on a non-empty table. | The migration fails on a production database with existing export rows, blocking the deployment. | Unprotected — no default, no backfill step, no conditional migration logic found in the reviewed files. | Run the migration against a non-empty `exports` table (even 1 row). Verify it fails. | Add a DEFAULT value (e.g., `'csv'`) and a separate backfill step for existing rows, or make the column nullable initially, backfill, then add NOT NULL. | High |
| P1 | New worker code never runs against rows where `format` is NULL. | `worker.ts:6` — `exportRow.format.toUpperCase()` assumes `format` is a non-null string. No null check or fallback. | A deployment window exists where (a) the migration hasn't run yet (column doesn't exist), (b) old code writes rows without `format` (NULL after migration), or (c) the migration partially completes. The worker crashes with a null dereference. | Unprotected — no null check, no fallback, no version gating found in `worker.ts`. | Deploy the worker before the migration completes, or insert a row with `format = NULL` while the worker processes exports. Verify crash. | Add a null/undefined check before `.toUpperCase()`, or use COALESCE with a default format. | High |
| P2 | The migration is fully rolled out before the new worker code starts processing. | `worker.ts` and `migration.sql` — no version gate, feature flag, or deploy ordering mechanism is visible. | A rolling deploy applies the worker before the migration on some nodes, or the migration completes but old worker instances still running write NULL values before the NOT NULL constraint is enforced. | Unprotected — no gating mechanism found in the reviewed files. | Simulate a rolling deploy where the worker code is active before the migration runs. Verify worker errors. | Ensure migration runs before worker rollout; consider making the column nullable temporarily, backfill, then add NOT NULL separately. | Medium |
| P2 | All consumers of the `format` column handle the pre-migration state. | `worker.ts:6` — only consumer visible; no other files reviewed. | Other services or queries read `exports` rows that lack `format` during the transition window. | Unknown — only `worker.ts` was inspected; other consumers in the codebase were not reviewed. | Search the codebase for all `exports` table reads. Verify they handle a missing `format` column or NULL value. | Audit all `exports` consumers for migration compatibility. | Low |

## Existing safeguards

- None found in the reviewed scope (`migration.sql` and `worker.ts` only).

## Required verification before release

- [ ] Run the migration against a production-like dataset to confirm it doesn't fail.
- [ ] Add a null guard in `worker.ts` before `format` access.
- [ ] Verify the deploy order: migration must complete before new worker code is active.
- [ ] Check all other consumers of the `exports` table for migration compatibility.

## Unknowns and boundaries

- Migration tooling (e.g., ActiveRecord, Flyway) behavior around NOT NULL column additions was not inspected — some tools handle this differently.
- The actual deploy process (rolling, blue/green, feature flags) is unknown.
- Other files or services reading `exports.format` were not reviewed.
- The table's current row count in production is unknown — the migration may be safe if the table is always empty.
