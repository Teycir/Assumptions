# Expected findings: tenant-leak

## P0 — No tenant scope in the query itself

- **Assumption:** The authenticated caller can only ever receive invoices
  belonging to their own tenant.
- **Evidence:** `db.invoice.findUnique({ where: { id: req.params.id } })`
  filters only by primary key. No `organizationId`, `tenantId`, or
  `userId` clause appears in the query.
- **If false:** An authenticated user from one tenant can read another
  tenant's invoice by supplying or guessing its ID (IDOR / cross-tenant
  data exposure).
- **Falsification test:** Authenticate as a user in tenant A, request an
  invoice ID known to belong to tenant B, and confirm the response is
  empty, 403, or 404 rather than the invoice data.
- **Status:** Unprotected in the query itself — no tenant/ownership clause
  found at the reviewed call site. Whether route-level middleware or
  database row-level security enforces scoping elsewhere in the stack was
  not confirmed in this fixture, so the overall system-level status is
  `Unknown` rather than a confident `Unprotected`.
- **Evidence confidence:** High for "the query has no tenant clause";
  Low for "no protection exists anywhere in the system" — these are two
  different claims and must not be merged into one label.

## Required distinction for this fixture

Because the fixture alone does not show whether route-level middleware or
database row-level security enforces tenant scoping elsewhere, a
correctly calibrated ledger should:

- Report this as `P0` given the severity if the query-level gap is
  unmitigated elsewhere, but
- Use a status of `Unprotected` for the query itself and `Unknown` for
  the system-wide question, rather than asserting confidently (in either
  direction) that no protection exists anywhere in the system.

## Non-findings

- Whether the invoice ID space is guessable/enumerable (sequential
  integer vs. UUID) is not shown in this fixture; if relevant, it should
  be raised as a separate finding with an `Unknown` status.
