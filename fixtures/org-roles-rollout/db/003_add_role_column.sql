-- Add a role column to support per-user admin permissions.
-- NOTE: nullable on purpose to avoid a NOT NULL failure on existing rows —
-- but no backfill statement follows. Existing users get role = NULL.
ALTER TABLE users ADD COLUMN role TEXT;

-- Intended follow-up (not present in this diff): backfill existing rows
-- to role = 'member', then a later migration can tighten this.
