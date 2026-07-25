# Assumptions: tests/src/billing/refund.ts

**Scope:** `tests/src/billing/refund.ts` (24 lines)
**Overall risk:** Medium
**Release blockers:** 0

## Executive summary

A refund endpoint that correctly verifies the caller owns the order (safeguard credited). Remaining risks: no idempotency key on the Stripe refund call (duplicate refund on retry), no transactional boundary between refund and status update, and no check for already-refunded status. No regression test was added alongside the ownership fix.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | Duplicate refund requests are prevented or safely deduplicated. | `refund.ts:16-18` — `stripe.refunds.create()` called with no idempotency key. No check for existing refund or `refunded` status before processing. | Retry or double-submit creates multiple Stripe refunds for one order. | Unprotected — no idempotency key found in `refund.ts`; no pre-check for `order.status === 'refunded'`. | Submit refundOrder twice for same order. Verify only one refund issued, status remains `refunded`. | Add idempotency key to Stripe refund call, or check `order.status` and reject if already refunded. | High |
| P1 | Stripe refund and order status update succeed or fail together. | `refund.ts:16-21` — sequential calls, no transaction, no compensating action. | Refund succeeds but `db.orders.update()` fails. Money returned but order still marked not-refunded, risking second refund attempt. | Unprotected — no transaction or compensating action found in `refund.ts`. | Inject failure into `db.orders.update()` after successful refund. Verify order recorded for reconciliation or auto-retry. | Wrap refund + status update in a transaction, or add compensating action (reverse refund) on update failure. | High |
| P1 | The order has not already been refunded before processing. | `refund.ts:5-21` — No check of `order.status` or existing refunds before Stripe call. Only existence check + ownership check. | Race condition or double-submit processes same order twice. Stripe allows multiple refunds on same charge. | Unprotected — no `refunded` status guard found in `refund.ts`. | Submit concurrent duplicate refund requests for same order. Verify only one refund created. | Add `if order.status === 'refunded'` guard with optimistic locking. | High |
| P2 | The ownership check added by this diff is covered by a regression test. | `refund.ts:12-14` — ownership check exists but no corresponding test file found in the reviewed scope. | A future refactor accidentally removes the ownership check and no test catches it. | Unprotected — no regression test found for the ownership check. Scope searched: `refund.ts` and no test files referencing this function were visible in the diff. | Check whether a test exists for the ownership path. If not, add one. | Add a test that verifies 403 for cross-user refund attempts. | High — absent test is directly observed. |
| P2 | `req.user.id` is always populated when this handler runs. | `refund.ts:12` — uses `req.user.id` for ownership check. No guard for `req.user` presence. | Endpoint reachable without auth. `req.user` is undefined, ownership check is meaningless. | Unknown — no auth middleware visible in `refund.ts`. Router-level auth not inspected. | Hit endpoint without auth. Verify 401/403. | Confirm auth middleware coverage at router level. | Medium |
| P2 | `order.chargeId` is always present on found orders. | `refund.ts:17` — `charge: order.chargeId` passed to Stripe without null check. | Order exists but has no `chargeId` (bypassed payment path). Stripe call fails with unclear error. | Unknown — no guarantee visible in `refund.ts` that all orders have `chargeId`. | Create order without chargeId (if possible) and attempt refund. Verify clear error. | Add check that `order.chargeId` exists before calling Stripe. | Low |

## Existing safeguards

- **Ownership check** (`refund.ts:12-14`): Verifies `order.userId === req.user.id` before processing refund — credited as Partially protected (req.user population not confirmed).
- **Existence check** (`refund.ts:7-9`): Returns 404 if order not found.

## Required verification before release

- [ ] Add idempotency key to `stripe.refunds.create()` or pre-check for already-refunded status.
- [ ] Add transactional protection between refund and status update.
- [ ] Add `order.status !== 'refunded'` guard.
- [ ] Add regression test for the ownership check.
- [ ] Verify auth middleware coverage for this route.

## Unknowns and boundaries

- Router-level auth and validation middleware not inspected.
- Stripe's Idempotency-Key header is available but not used.
- Database constraints (unique order ID on refunds) may partially protect — not inspected.
- Concurrency model (optimistic locking, transaction isolation) not confirmed.
