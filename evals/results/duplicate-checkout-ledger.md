# Assumptions: fixtures/duplicate-checkout/checkout.ts

**Scope:** `fixtures/duplicate-checkout/checkout.ts` (19 lines) — a POST /checkout endpoint that creates a Stripe charge and an order record.
**Overall risk:** High
**Release blockers:** 1

## Executive summary

A minimal checkout endpoint with no idempotency protection, no input validation, and no transactional boundary between the payment and order creation steps. The highest-risk finding is that a network retry will create duplicate Stripe charges with no deduplication mechanism. Additionally, partial failure between the charge and order write leaves the system in an inconsistent state. The overall evidence confidence is High because the missing protections are directly observable from the code.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | Duplicate payment requests are prevented or safely deduplicated. | `checkout.ts:8` — `stripe.charges.create()` called with no idempotency key. No dedup check against `orders` table before creating charge. | A retry or double-submit creates multiple Stripe charges for a single intended purchase. | Unprotected — no idempotency key found in `checkout.ts`; no dedup or pre-check logic visible in the file. | Simulate a network timeout on `stripe.charges.create()` while the charge actually succeeds, then retry the request. Verify only one charge and one order exist. | Add an idempotency key (e.g., idempotency_key from request header or derived from a client-side request ID) to the Stripe charge call, or check for an existing order before charging. | High |
| P1 | The payment charge always completes before the order is created. | `checkout.ts:8-16` — `stripe.charges.create()` and `orders.create()` are sequential but not in a transaction. No rollback step if order creation fails after charge succeeds. | The charge succeeds but `orders.create()` fails (DB error, validation), resulting in a payment with no corresponding order and no automatic reversal. | Unprotected — no transaction, compensating action, or dead-letter handling found in `checkout.ts`. | Inject a failure into `orders.create()` after a successful Stripe charge. Verify that a compensating refund is issued or the orphaned charge is recorded for recovery. | Wrap the charge + order creation in a transaction, or add a compensating action (refund on order write failure) with monitoring. | High |
| P1 | `req.body.amount` is a valid positive number. | `checkout.ts:9` — `amount: req.body.amount` is passed directly to Stripe without type, range, or null checks. | A missing, negative, zero, string, or absurdly large `amount` causes a Stripe API error or, in edge cases, an unintended charge. | Unprotected — no input validation found in `checkout.ts`. | Send requests with missing `amount`, `amount: 0`, `amount: -1`, `amount: "abc"`. Verify Stripe rejects or the endpoint returns 4xx before charging. | Add input validation (non-null, positive number, max bound) before calling Stripe. | High |
| P2 | `req.user.stripeCustomerId` is always set for authenticated users. | `checkout.ts:10` — accesses `req.user.stripeCustomerId` without a null check or fallback. | A user authenticated but without a Stripe customer ID (e.g., pre-registration state) causes a runtime error or unexpected charge behavior. | Unknown — no source of `req.user` or Stripe customer ID provisioning is visible in the reviewed file. | Register a user without a Stripe customer ID, authenticate, and POST to /checkout. Verify a clear error is returned. | Verify Stripe customer ID provisioning in the registration flow; add a check before charging. | Medium |
| P2 | An authenticated `req.user` is always present at this handler. | `checkout.ts:7` — route handler uses `req.user` without an explicit guard. | The endpoint is reachable without authentication, leading to unauthorized payment creation. | Unknown — no auth middleware or guard is visible in `checkout.ts`. The surrounding router config was not inspected. | Hit the endpoint without authentication. Verify it returns 401/403 before processing payment. | Confirm auth middleware is applied at the router level; add a defensive guard. | Medium |

## Existing safeguards

- None found in the reviewed scope (`checkout.ts` only; no router, middleware, or infrastructure config was inspected).

## Required verification before release

- [ ] Confirm that an idempotency key is provided to Stripe (at the caller or proxy level) — or add one.
- [ ] Add input validation for `amount` (non-null, positive, max bound).
- [ ] Add transactional or compensating-action protection between charge creation and order creation.
- [ ] Verify auth middleware coverage for this route.

## Unknowns and boundaries

- Router-level middleware (auth, rate limiting, request validation) was not inspected — the endpoint may already be protected upstream.
- Stripe webhook or reconciliation logic that might catch orphaned charges was not reviewed.
- Queue or event-driven retry behavior at the infrastructure level is unknown.
