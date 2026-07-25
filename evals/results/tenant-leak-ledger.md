# Assumptions: fixtures/tenant-leak/invoices.ts

**Scope:** `fixtures/tenant-leak/invoices.ts` (11 lines)
**Overall risk:** High
**Release blockers:** 1

## Executive summary

A GET /invoices/:id endpoint that queries an invoice by primary key only, with no tenant or ownership scope. Any authenticated user can read any invoice by ID. The query-level gap is directly observable (Unprotected, High confidence); whether system-wide protection exists via middleware or database RLS is Unknown since those layers were not inspected.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | The authenticated caller can only ever receive invoices they own. | `invoices.ts:6-8` — `db.invoice.findUnique({ where: { id: req.params.id } })` filters by ID only. No `userId`, `organizationId`, or tenant clause in the query. No post-query ownership check. | User A requests `/invoices/B` and receives User B's invoice data (IDOR / cross-tenant data exposure). | Unprotected at the query level — no ownership clause in `where`. System-wide protection (middleware, RLS) may exist elsewhere but was not inspected, so the system-level status is Unknown. | Authenticate as User A, request invoice ID belonging to User B. Verify 403, not invoice data. | Add ownership filter to query (`where: { id, userId: req.user.id }`) or post-query authorization check. | High for query-level gap; Low for system-wide absence. |
| P1 | `req.params.id` is a valid, existing invoice ID. | `invoices.ts:7` — `req.params.id` passed directly to `findUnique` without format validation. No null check on result before `res.json(invoice)`. | Non-existent ID causes `findUnique` to return null → `res.json(null)` returns 200 with null body, not 404. | Partially protected — Prisma returns null rather than throwing, but explicit 404 is absent. | Request `/invoices/nonexistent`. Verify 404 not 200+null. | Add null check on query result, return 404 if not found. | High |
| P1 | An authenticated `req.user` is present at this handler. | `invoices.ts:5` — handler uses `req.user` implicitly. No guard. | Endpoint reachable without auth, making any protection relying on `req.user` ineffective. | Unknown — no auth middleware visible in `invoices.ts`. Router-level auth not inspected. | Hit endpoint without auth. Verify 401/403. | Confirm auth middleware coverage at router level. | Medium |
| P2 | Invoice IDs are not guessable or enumerable. | `invoices.ts:7` — query by `req.params.id`. ID strategy not visible. | If IDs are sequential integers, attacker enumerates all invoices regardless of ownership fix. | Unknown — ID generation strategy not visible in this file. | Attempt ID enumeration. Report if sequential. | Use UUIDs or rate-limit the endpoint. | Low — no evidence about ID format in reviewed scope. |
| P2 | Response does not expose sensitive fields beyond what caller should see. | `invoices.ts:10` — `res.json(invoice)` returns full invoice object without projection. | Invoice object may contain internal fields (cost basis, processor IDs, PII) exposed to caller. | Unprotected — no projection or DTO applied in `invoices.ts`. | Inspect full response for sensitive fields. | Apply projection or response DTO to limit exposed fields. | Medium |

## Existing safeguards

- None found in `invoices.ts`. Router-level auth, database RLS not inspected.

## Required verification before release

- [ ] Add ownership scoping to query or post-query authorization check.
- [ ] Add null check on invoice result → 404.
- [ ] Confirm auth middleware coverage for this route.
- [ ] Review response payload for sensitive field exposure.
- [ ] Check ID generation strategy for enumerability.

## Unknowns and boundaries

- Router-level auth middleware not inspected — route may already require authentication.
- Database RLS policies may provide ownership isolation beyond what application code shows.
- ID generation strategy unknown.
- Other routes on this resource may have similar gaps.
