-- Add organization scoping to orders table.
ALTER TABLE orders ADD COLUMN organization_id INTEGER NOT NULL;
