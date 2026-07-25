# Assumptions: `src/billing/refund.ts` staged diff

**Scope:** Staged git diff in `tests/` — single file `src/billing/refund.ts`. The diff adds an ownership check (`order.userId !== req.user.id`) before calling `stripe.refunds.create()`.
**Overall risk:** High
**Release blockers:** 1 (P0)

## Executive summary

The staged diff adds a meaningful ownership check for cross-tenant refund prevention, but leaves the pre-existing idempotency gap unprotected (P0 — no idempotency key on Stripe refund calls). The ownership check itself is a visible safeguard (Partially protected), though `req.user` population relies on auth middleware not present in this repository. Additionally, the Stripe refund and DB update are not atomic (P1 — crash after Stripe success loses consistency). No tests exist for any of these paths (P2). Recommend adding an idempotency key, confirming auth middleware in the host app, and adding test coverage before release.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | Duplicate refund requests are prevented or safely deduplicated. | `src/billing/refund.ts:17` — `stripe.refunds.create({ charge: order.chargeId, amount: order.amount })` with no idempotency key argument. No idempotency logic, dedup table, or DB-level guard found in `src/`, `db/`, or project root. **UNCHANGED by diff.** | A retry (network timeout, double-click, Stripe webhook replay) issues two refunds for the same charge, causing duplicate financial loss. | Unprotected — no idempotency key, dedup table, or `WHERE status != 'refunded'` guard in the searched scope (`src/`, `db/`, project root). | Call `refundOrder` twice with the same `orderId`. Verify `stripe.refunds.create` is invoked twice with identical `charge`/`amount` parameters (no deduplication). | Pass `idempotencyKey: "refund-" + orderId` to `stripe.refunds.create`. Consider a DB check `WHERE status != 'refunded'` before the update. | High |
| P1 | Authentication middleware populates `req.user` with a verified caller identity before `refundOrder` runs. | Ownership check exists: `src/billing/refund.ts:13` (staged diff adds `if (order.userId !== req.user.id) return 403`). This IS a new safeguard. However, no Express/Fastify app setup, middleware config, auth module, or route registration exists in this repo (searched `src/`, `db/`, project root for `app.ts`, `server.ts`, `middleware/`, `auth/`, `config/` — none found). | `req.user` could be undefined, null, or attacker-controlled. The ownership check would crash (TypeError on `.id`) or pass incorrectly, allowing unauthorized refunds. | Partially protected — the diff visibly adds an ownership check that blocks mismatched userIds. But auth middleware population of `req.user` cannot be confirmed from repo evidence alone. | Inspect the host app's Express/Fastify setup (outside this repo) to confirm auth middleware is registered before the refund route. Or send a request without auth headers and verify 401/403, not 500. | Add a type guard at the handler boundary (`if (!req.user) throw new AuthError()`). Confirm auth middleware registration externally. | High — ownership check directly observed; exhaustive search confirms no auth setup in repo. |
| P1 | After `stripe.refunds.create()` succeeds, the order status DB update always completes. | `src/billing/refund.ts:17-21` — `stripe.refunds.create()` and `db.orders.update()` are sequential calls with no transaction, Saga, outbox, or compensation pattern. No such patterns found in `src/` or `db/`. | Process crashes after Stripe refunds the charge but before `db.orders.update` writes. Order status stays "paid" despite real money refunded. On retry, the caller sees "paid" and may issue another refund. | Unprotected — no transaction boundary, compensation, or outbox found in `src/` or `db/`. | Kill the process after `stripe.refunds.create` returns but before `db.orders.update` executes. Verify the DB still shows `status = 'paid'` while Stripe has recorded the refund. | Wrap in a DB transaction, or use an outbox/eventual-consistency pattern. Add `WHERE status != 'refunded'` on the update as a guard. | High — direct observation of sequential calls with no transactional boundary. |
| P2 | The new ownership check's behavior is verified under valid, invalid, and missing-auth scenarios. | No test files exist anywhere in the repository (searched all paths for `*.test.ts`, `*.spec.ts`, `__tests__/`, `tests/`, `test/` — none found). | Regressions or edge cases (null `req.user`, type mismatch, race conditions in userId comparison) are not caught before deployment. | Unprotected — no tests found anywhere in the repository. | Write a test with `order.userId !== req.user.id` (expect 403) and another where they match (expect `stripe.refunds.create` called with correct args). Include a case where `req.user` is undefined. | Add at least unit tests covering: ownership match (200), ownership mismatch (403), missing `req.user` (500 or 401). | High — no test files exist in repo. |

## Existing safeguards

- **Ownership check (NEW in diff):** `src/billing/refund.ts:13` — `if (order.userId !== req.user.id) return res.status(403)` prevents cross-tenant refunds when `req.user` is correctly populated by auth middleware.
- **404 on missing order:** `src/billing/refund.ts:9-11` — returns 404 if `db.orders.findById` returns null.

## Required verification before release

- [ ] Verify the host application registers auth middleware that populates `req.user.id` before the refund route (outside this repo).
- [ ] Add an idempotency key to the `stripe.refunds.create` call (P0).
- [ ] Add unit tests for the ownership check (P2).

## Unknowns and boundaries

- The host application's Express/Fastify setup, middleware chain, and route registration are outside this repository. Whether auth middleware populates `req.user` for the refund route cannot be determined from the code here. This affects the real-world protection level of the ownership check, but does not diminish the check itself as a valid safeguard.
- Stripe API behavior (idempotency defaults, refund idempotency semantics) is not documented in the repo. The recommendation assumes standard Stripe behavior where `refunds.create` is not idempotent without a key.
- Queue/worker deployment ordering and migration rollout were not analyzed (no workers or pending migrations in the staged diff scope).
