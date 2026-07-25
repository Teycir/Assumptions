# Assumptions: fixtures/migration-rollout/

**Scope:** `fixtures/migration-rollout/migration.sql` + `fixtures/migration-rollout/worker.ts`
**Overall risk:** High
**Release blockers:** 2

## Executive summary

Two independent P0 findings. The migration itself (`ALTER TABLE exports ADD COLUMN format TEXT NOT NULL` with no default) will fail on any non-empty `exports` table. Separately, the worker reads `exportRow.format.toUpperCase()` with no null check — if the migration somehow succeeds but pre-existing or concurrently-written rows lack a format value, the worker crashes. Per the ranking rule: both are release blockers ranked by consequence, not by which file the evidence sits in.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | The migration is compatible with existing rows in `exports`. | `migration.sql:4` — `ALTER TABLE exports ADD COLUMN format TEXT NOT NULL` with no `DEFAULT` clause. PostgreSQL requires a value for existing rows; without DEFAULT the statement fails on a non-empty table. | Migration fails on a production database with existing export rows, blocking deployment. | Unprotected — no default value, no backfill step, no conditional migration logic found in the two reviewed files. | Run the migration against a non-empty `exports` table (even 1 row). Verify it fails. | Add a DEFAULT value and a separate backfill step, or make column nullable initially, backfill, then add NOT NULL. | High |
| P0 | New worker code remains safe before, during, and after the schema transition. | `worker.ts:6` — `exportRow.format.toUpperCase()` has no null check or fallback. Worker directly dereferences the new column. | During rollout (migration not yet complete) or rollback (column removed), the worker crashes with a null dereference. Also applies if old code writes rows without `format` before NOT NULL is enforced. | Unprotected — no null check, no fallback, no version gating found in `worker.ts`. | Deploy worker before migration completes, or insert a row with `format = NULL` while worker runs. Verify crash. | Add null check before `.toUpperCase()` or use COALESCE with a default. Deploy migration before worker code. | High |
| P1 | Both old and new writers can create valid `exports` rows throughout the rollout, and a partial rollback stays safe. | Column is both added and made NOT NULL in a single step, with no intermediate nullable phase. Old code (which doesn't set `format`) writing during the transition produces NULL violations. | A simultaneous old-code writer tries to insert a row without `format`; the NOT NULL constraint rejects the insert, causing a 500 error for that request. Rollback of migration after worker ships leaves worker reading a non-existent column. | Unprotected — no expand/contract pattern (nullable → backfill → NOT NULL) found in the two reviewed files. | Roll back the migration only, leaving new worker code deployed. Observe worker failure. | Use expand/contract: add nullable column → backfill → add NOT NULL → deploy worker. | Medium — the migration pattern is directly observed, but the actual deploy ordering and whether old writers will be active during the transition depends on deployment infrastructure not inspected here. |

## Existing safeguards

- None found in `migration.sql` and `worker.ts`. Deply platform ordering guarantees, feature flags, and other consumer files not inspected.

## Required verification before release

- [ ] Run migration against production-sized dataset before deploying.
- [ ] Add null guard in `worker.ts` before `format` access.
- [ ] Adopt expand/contract pattern (nullable column → backfill → NOT NULL) rather than single-step NOT NULL addition.
- [ ] Verify deploy order: migration must complete before new worker code activates.

## Unknowns and boundaries

- Migration tooling behavior around NOT NULL column additions (some tools handle this differently).
- Actual deploy process (rolling, blue/green, feature flags) not inspected.
- Other consumers of `exports` table not reviewed.
- Current row count in `exports` table unknown — if table is always empty, migration risk is moot.
