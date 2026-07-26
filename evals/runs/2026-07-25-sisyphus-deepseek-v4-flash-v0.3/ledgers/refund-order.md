# Assumptions: tests/src/billing/refund.ts

**Scope:** `tests/src/billing/refund.ts` (24 lines) — staged diff adding an ownership check to `refundOrder`.
**Overall risk:** High
**Release blockers:** 1

## Executive summary

The diff adds a real ownership check before refunding, which should be credited as a safeguard for cross-tenant refund risk specifically — but its actual protection depends on `req.user` being populated by auth middleware not visible in this file, so that's Unknown, not Protected. Separately and unchanged by this diff, there's still no idempotency key on the Stripe refund call, which remains the top blocker. No regression test was added alongside the new check.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | Duplicate refund requests are prevented or safely deduplicated | `refund.ts:16-19` — `stripe.refunds.create({charge, amount})`, no idempotency key; unchanged by this diff | A retry or double-click issues two refunds for the same order | Unprotected — no idempotency key or pre-check for already-refunded status found in `refund.ts` | Submit `refundOrder` twice concurrently for the same order; verify only one refund is issued | Add an idempotency key to the Stripe refund call, or check `order.status` before processing | High |
| P1 | `req.user` is populated and verified by the time this handler runs | `refund.ts:12` — `req.user.id` is read with no visible auth middleware in this file or its imports | If `req.user` is unset or forgeable, the new ownership check is bypassed or throws | Unknown — no auth middleware visible in this file; whether it runs upstream wasn't inspected | Trace the route registration for this handler; confirm auth middleware runs first | Verify auth middleware wraps this route; add a test asserting 401/403 when `req.user` is absent | Low |
| P2 | Cross-tenant refund access is blocked for this handler specifically | `refund.ts:12-14` — the new `if (order.userId !== req.user.id)` check | None if auth is verified upstream; same risk as P1 otherwise | Partially protected — a real safeguard was added by this diff and should be credited as such | Call the handler with another user's orderId, authenticated as a different user; expect 403 | Keep the check; close out the P1 verification to upgrade this to Protected | Medium |
| P3 | The new ownership check has regression coverage | No test files found under `tests/src` alongside `refund.ts` | A future refactor could silently remove the check with nothing to catch it | Unprotected — no test found in the searched scope | Search the test suite for a refund test — none found | Add a unit test asserting 403 when order.userId !== req.user.id | High |

## Existing safeguards

- Ownership check comparing `order.userId` to `req.user.id` before refunding (`refund.ts:12-14`).
- Order-existence check returning 404 before proceeding (`refund.ts:7-9`).

## Required verification before release

- [ ] Add an idempotency key to the Stripe refund call.
- [ ] Confirm auth middleware runs before this handler and populates req.user reliably.
- [ ] Add a regression test for the ownership check.

## Unknowns and boundaries

- Auth middleware existence and ordering relative to this handler not confirmed.
- stripe-webhook.ts and db/002_add_org_id.sql are out of scope for this diff (staged file is refund.ts only).
