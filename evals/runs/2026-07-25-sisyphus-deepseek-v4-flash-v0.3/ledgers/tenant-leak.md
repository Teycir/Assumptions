# Assumptions: fixtures/tenant-leak/invoices.ts

**Scope:** `fixtures/tenant-leak/invoices.ts` (11 lines) — GET /invoices/:id queries by primary key only.
**Overall risk:** High
**Release blockers:** 1

## Executive summary

The query filters only by `id`, with no tenant, organization, or user clause. This is a direct IDOR risk if nothing else in the request path scopes access — but whether something else does (auth middleware, row-level security) isn't visible in this file, so the system-wide question is genuinely unknown, not confidently either way.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | The authenticated caller can only ever receive invoices belonging to their own tenant | `invoices.ts:6-8` — `db.invoice.findUnique({ where: { id: req.params.id } })` filters only by primary key; no organizationId/tenantId/userId clause | An authenticated user from one tenant reads another tenant's invoice by supplying or guessing its ID (IDOR / cross-tenant exposure) | Unprotected at the query level (no tenant clause found here); Unknown at the system level (whether middleware or row-level security scopes this elsewhere was not inspected) | Authenticate as tenant A, request an invoice ID known to belong to tenant B, confirm the response is empty/403/404 rather than the invoice | Add an explicit tenant/ownership clause to this query regardless of what else may exist upstream | High for the query-level fact; Low for the system-wide claim — reported separately, not merged |
| P2 | The invoice ID space is not easily guessable or enumerable | `invoices.ts:5` — `req.params.id` used directly, no visible ID format in this file | If IDs are sequential, the P0 above becomes trivially enumerable rather than requiring a guessed/leaked ID | Unknown — ID generation strategy not visible in this fixture | Inspect the invoice schema/migration for the ID column type | If sequential, consider a non-guessable identifier as a secondary mitigation | Low |

## Existing safeguards

- None found in the reviewed scope (`invoices.ts` only; middleware, auth chain, and database RLS configuration not inspected).

## Required verification before release

- [ ] Add an explicit tenant/ownership clause to this query.
- [ ] Confirm whether middleware or RLS provides scoping elsewhere.
- [ ] Check the invoice ID generation strategy for guessability.

## Unknowns and boundaries

- Whether route-level middleware or database row-level security enforces tenant scoping elsewhere in the stack was not confirmed in this fixture.
- Invoice ID generation strategy (sequential vs. UUID) not shown.
