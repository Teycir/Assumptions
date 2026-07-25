# Assumptions: fixtures/duplicate-checkout/checkout.ts

**Scope:** `fixtures/duplicate-checkout/checkout.ts` (19 lines)
**Overall risk:** High
**Release blockers:** 1

## Executive summary

A minimal checkout endpoint with no idempotency protection on the Stripe charge call and no transactional boundary between payment and order creation. The highest-risk finding is duplicate payment on retry. Input validation status for `amount` is Unknown — no middleware or router layer was inspected, so the observed-vs-inferred test prevents calling it Unprotected.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | Duplicate checkout requests are prevented or safely deduplicated. | `checkout.ts:8` — `stripe.charges.create()` called with no idempotency key. No dedup check against `orders` before charging. | Network retry or double-submit creates multiple Stripe charges for one intended purchase. | Unprotected — no idempotency key found in `checkout.ts`; no pre-check logic visible. | Simulate timeout on `stripe.charges.create()` while charge actually succeeds, retry. Verify one charge + one order. | Add idempotency key to Stripe call, or check for existing order before charging. | High |
| P1 | Payment charge and order creation succeed or fail together. | `checkout.ts:8-16` — sequential calls, no transaction, no compensating action. | Charge succeeds but `orders.create()` fails (DB error). Payment with no order record and no automatic reversal. | Unprotected — no transaction or compensating action found in `checkout.ts`. | Inject failure into `orders.create()` after successful charge. Verify compensating refund or orphan recorded for recovery. | Wrap in transaction, or add compensating refund with monitoring. | High |
| P1 | `req.body.amount` is a valid positive number. | `checkout.ts:9` — `amount: req.body.amount` passed directly to Stripe without type/range/null checks. | Missing, negative, zero, or absurdly large amount causes Stripe API error or unintended charge. | Unknown — no input validation visible in `checkout.ts`, but middleware or gateway-level validation may exist upstream and was not inspected. Per observed-vs-inferred test: Unprotected would overstate what the fixture shows. | Send requests with missing amount, amount: 0, amount: -1. Verify 4xx before Stripe call. | Add input validation (non-null, positive, max bound) before Stripe call. | Medium — absence of validation in this handler is directly observed, but whether validation exists elsewhere in the stack is unknown. |
| P2 | `req.user.stripeCustomerId` is always set for authenticated users. | `checkout.ts:10` — accesses `req.user.stripeCustomerId` without null check or fallback. | User authenticated but without Stripe customer ID causes runtime error or unexpected charge behavior. | Unknown — source of `req.user` and Stripe customer ID provisioning not visible in this file. | Register user without Stripe customer ID, authenticate, POST to /checkout. Verify clear error. | Verify Stripe customer ID provisioning in registration flow; add guard before charging. | Medium |
| P2 | An authenticated `req.user` is always present at this handler. | `checkout.ts:7` — uses `req.user` without explicit guard. | Endpoint reachable without auth, leading to unauthorized payment creation. | Unknown — no auth middleware visible in `checkout.ts`. Router-level auth not inspected. | Hit endpoint without auth. Verify 401/403 before processing payment. | Confirm auth middleware at router level; add defensive guard. | Medium |
| P2 | An orphaned charge (paid but no matching order) is detected in reasonable time. | No logging, metric, or alert around mismatch between successful charges and created orders. | Orphaned charge goes undetected until customer complaint. | Unprotected — no observability found in `checkout.ts`. | N/A — process gap. | Add monitoring for successful charges without matching orders within a time window. | Medium |

## Existing safeguards

- None found in `checkout.ts`. Router, middleware, infrastructure not inspected.

## Required verification before release

- [ ] Confirm idempotency key is provided to Stripe or add one.
- [ ] Add transactional protection between charge and order creation.
- [ ] Add input validation for `amount`.
- [ ] Verify auth middleware coverage for this route.
- [ ] Add monitoring for orphaned charges.

## Unknowns and boundaries

- Router-level auth, validation, rate-limiting middleware not inspected.
- Stripe webhook/reconciliation logic not reviewed.
- Queue or event-driven retry behavior at infrastructure level unknown.
