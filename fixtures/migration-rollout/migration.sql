-- Fixture: migration-rollout
-- A NOT NULL column added with no default and no backfill step.

ALTER TABLE exports ADD COLUMN format TEXT NOT NULL;
