# Assumptions: tests/src/billing/refund.ts

**Scope:** `tests/src/billing/refund.ts` (24 lines) — a refund endpoint adding ownership verification before processing a Stripe refund and updating the order status.
**Overall risk:** Medium
**Release blockers:** 0

## Executive summary

A refund endpoint that correctly verifies the caller owns the order (good) but has no idempotency protection on the Stripe refund call and no transactional boundary between the refund and the status update. The ownership guard eliminates the highest-priority tenant-leak risk, but duplicate refunds on retry and partial-failure inconsistency remain unaddressed.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | Duplicate refund requests are prevented or safely deduplicated. | `refund.ts:16-18` — `stripe.refunds.create()` called with no idempotency key. No check for existing refund or `refunded` status before processing. | A retry or double-submit creates multiple Stripe refunds for a single order. | Unprotected — no idempotency key found in `refund.ts`; no pre-check for `order.status === 'refunded'` before creating the refund. | Submit `refundOrder` twice for the same order. Verify only one refund is issued and the order status remains `refunded`. | Add an idempotency key (from request header or derived key) to the Stripe refund call, or check `order.status` and reject if already refunded. | High |
| P1 | Stripe refund always completes before the order status update. | `refund.ts:16-21` — `stripe.refunds.create()` then `db.orders.update()` in sequence without a transaction. | Refund succeeds but the status update fails, leaving the order marked as not-refunded despite real money being returned. This could trigger a second refund attempt. | Unprotected — no transaction wrapping the two operations; no compensating action if the update fails. | Inject a failure into `db.orders.update()` after a successful Stripe refund. Verify the order is recorded for reconciliation or automatically re-attempted. | Wrap refund + status update in a transaction, or add a compensating action (reverse refund) on update failure with monitoring. | High |
| P1 | The order has not already been refunded before processing. | `refund.ts:5-21` — No check of `order.status` or existing refunds before calling Stripe. Only an existence check (`findById`) and ownership check exist. | A race condition or double-submit processes the same order twice. The second `stripe.refunds.create()` succeeds (Stripe allows multiple refunds), creating a duplicate payout. | Unprotected — no refunded-status guard found in `refund.ts`. | Submit concurrent duplicate refund requests for the same order. Verify only one refund is issued. | Add a status check (`if order.status === 'refunded'`) before processing, enforced with optimistic locking. | High |
| P2 | `req.body.orderId` is a valid, existing order ID. | `refund.ts:5` — `db.orders.findById(req.body.orderId)`. No format validation before the DB call. | A malformed or non-existent `orderId` results in a null order, which is handled (404). Risk is low. | Protected — `findById` returns null for non-matching IDs and the handler returns 404. No format validation but the outcome is safe. | Send a request with a non-existent orderId. Verify 404. | Add format validation for earlier rejection, but not high priority. | High |
| P2 | `req.user` is always populated with the authenticated user. | `refund.ts:5,12` — Uses `req.user.id` for ownership check. No guard for `req.user` presence. | The endpoint is reachable without auth, making `req.user` undefined and the ownership check meaningless. | Unknown — no auth middleware visible in `refund.ts`. Router-level auth coverage not inspected. | Hit the endpoint without authentication. Verify 401/403. | Confirm auth middleware coverage at the router level. | Medium |
| P2 | `order.chargeId` is always present on found orders. | `refund.ts:17` — `charge: order.chargeId` passed directly to Stripe without a null check. | An order record exists but has no `chargeId` (e.g., created through a path that bypassed payment). The Stripe call would fail with unclear error. | Unknown — no guarantee visible in `refund.ts` that all orders have `chargeId`. | Create an order without a chargeId (if possible) and attempt to refund it. Verify a clear error message. | Add a check that `order.chargeId` exists before calling Stripe. | Low |

## Existing safeguards

- **Ownership check** (`refund.ts:12-14`): Verifies `order.userId === req.user.id` before processing, preventing tenant-inappropriate refund access.
- **Existence check** (`refund.ts:7-9`): Returns 404 if the order is not found.

## Required verification before release

- [ ] Add idempotency key to `stripe.refunds.create()` or pre-check for already-refunded status.
- [ ] Add transactional protection between the refund and the status update.
- [ ] Add `order.status !== 'refunded'` guard before processing.
- [ ] Verify auth middleware coverage for this route.
- [ ] Add a null check for `order.chargeId`.

## Unknowns and boundaries

- Router-level auth and validation middleware was not inspected.
- Stripe's own idempotency behavior (the API supports `Idempotency-Key` header) is available but not used.
- The database may have constraints (e.g., unique order ID on refunds) that partially protect against duplicates — not inspected.
- Concurrency model (optimistic locking, DB transaction isolation) is not confirmed.
