# Assumptions: fixtures/tenant-leak/invoices.ts

**Scope:** `fixtures/tenant-leak/invoices.ts` (11 lines) — a GET /invoices/:id endpoint that returns an invoice by ID.
**Overall risk:** High
**Release blockers:** 1

## Executive summary

A single-file endpoint that queries an invoice by primary key only, with no tenant or ownership scope in the database query. Any authenticated user can read any invoice by guessing or enumerating IDs. No authorization check exists anywhere in the reviewed path. This is a direct horizontal privilege escalation vulnerability.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | A caller can only access invoices they own. | `invoices.ts:6-8` — `db.invoice.findUnique({ where: { id: req.params.id } })` filters by ID only. No `userId` or tenant scope is added to the query. No post-query ownership check. | User A requests `/invoices/B` and receives User B's invoice data, exposing financial or personal information. | Unprotected — no ownership filter in the query (`where: { id }`) and no post-query authorization check found in `invoices.ts`. | Authenticate as User A, request an invoice ID belonging to User B. Verify the API returns 403, not the invoice data. | Add a `where` clause filtering by user/tenant ownership (e.g., `where: { id: req.params.id, userId: req.user.id }`), or add a post-query ownership check. | High |
| P1 | `req.params.id` is a valid, existing invoice ID. | `invoices.ts:7` — `req.params.id` passed directly to `findUnique()` without format validation. | A non-existent, malformed, or deleted invoice ID causes a null response, potential error, or undefined behavior in the caller. | Partially protected — Prisma's `findUnique` returns `null` for non-matching IDs, so a 404 is implied. But no explicit null check exists before `res.json(invoice)`, which would return `null` (200 OK) rather than a 404. | Request `/invoices/nonexistent-id`. Verify the API returns 404, not 200 with `null`. | Add a null check on the query result and return 404 if not found. | High |
| P1 | An authenticated `req.user` is present at this handler. | `invoices.ts:5` — route handler uses implicit `req.user` context (for ownership comparison later). No explicit guard. | The endpoint is reachable without authentication, making invoice data accessible to unauthenticated users. | Unknown — no auth middleware or guard visible in `invoices.ts`. The router config was not inspected. | Hit the endpoint without authentication. Verify 401/403. | Confirm auth middleware coverage at the router level. | Medium |
| P2 | Invoice IDs are not guessable or enumerable. | `invoices.ts:7` — query by `req.params.id`. If IDs are sequential integers, an attacker can enumerate all invoices. | An attacker iterates through sequential invoice IDs to collect all invoice data. | Unknown — ID generation strategy is not visible in the reviewed file. UUIDs vs. auto-increment integers make a significant difference. | Attempt to enumerate invoice IDs. If sequential, report the enumeration risk. | Use non-guessable IDs (UUIDs) or implement rate limiting on the endpoint. | Low |
| P2 | Response does not leak sensitive fields beyond what the caller should see. | `invoices.ts:10` — `res.json(invoice)` returns the full invoice object. | The invoice object may contain internal fields (cost basis, processor IDs, PII) that should not be exposed to the caller, even if ownership is later fixed. | Unprotected — no projection or field filtering is applied before the response. The full `invoice` object is returned as-is. | Inspect the full response body for sensitive fields not needed by the client. | Apply a projection or response DTO to limit exposed fields. | Medium |

## Existing safeguards

- None found in the reviewed scope (`invoices.ts` only; no router, auth middleware, or schema definitions were inspected).

## Required verification before release

- [ ] Add ownership scoping to the database query or a post-query authorization check.
- [ ] Add a null check on the invoice query result and return 404.
- [ ] Confirm auth middleware is applied to this route.
- [ ] Review the response payload for sensitive field exposure.
- [ ] Check ID generation strategy for enumerability.

## Unknowns and boundaries

- Router-level auth middleware was not inspected — the route may already require authentication.
- The database schema may have row-level security (RLS) policies that provide ownership isolation at the database level beyond what the application code shows.
- ID generation strategy is unknown.
- Other routes on this resource may have similar or different protections.
