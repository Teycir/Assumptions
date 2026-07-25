# Expected findings: tenant-leak

## P0 — No tenant scope in the query itself

- **Evidence:** `db.invoice.findUnique({ where: { id: req.params.id } })`
  filters only by primary key. No `organizationId`, `tenantId`, or
  `userId` clause appears in the query.
- **If false:** An authenticated user from one tenant can read another
  tenant's invoice by supplying or guessing its ID (IDOR / cross-tenant
  data exposure).
- **Falsification test:** Authenticate as a user in tenant A, request an
  invoice ID known to belong to tenant B, and confirm the response is
  empty, 403, or 404 rather than the invoice data.
- **Confidence:** Likely (authentication middleware presence is unknown
  from this fixture alone; if it exists but doesn't enforce tenant scope,
  this is Verified)

## Required distinction for this fixture

Because the fixture alone does not show whether route-level middleware or
database row-level security enforces tenant scoping elsewhere, a
correctly calibrated ledger should:

- Report this as `P0` given the severity if true, but
- Explicitly label the "is there scoping elsewhere" question as
  `Assumption to verify` rather than asserting confidently that no
  protection exists anywhere in the system.

## Non-findings

- Whether the invoice ID space is guessable/enumerable (sequential
  integer vs. UUID) is not shown in this fixture; if relevant, it should
  be raised as a separate, clearly labeled `Unknown`.
