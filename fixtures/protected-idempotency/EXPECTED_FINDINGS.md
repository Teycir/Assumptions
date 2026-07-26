# Expected findings: protected-idempotency

This fixture tests whether the skill correctly identifies a fully **Protected** idempotency setup (provider idempotency key + DB unique constraint) and avoids generating false-positive P0 missing-idempotency defects.

## Protected Safeguards (should be credited, not flagged as defects)

### Protected — Payment and order creation idempotency is verified

- **Assumption:** Concurrent or duplicate payment requests are deduplicated at both the gateway and database layers.
- **Evidence:** `stripe.charges.create()` passes `{ idempotencyKey }` derived from `x-idempotency-key` header; `orders.create()` records `idempotencyKey` inside a database transaction with a unique constraint.
- **If false:** Duplicate requests could cause double charges.
- **Status:** Protected
- **Evidence confidence:** High
- **Falsification test:** Submit two concurrent requests with the same `x-idempotency-key`; verify Stripe returns the same charge response and the database rejects the second insert via unique constraint violation.

## Non-findings / Prohibited Claims

- **Do NOT flag missing idempotency:** Both the API call and DB insertion enforce idempotency.
- **Do NOT report false P0/P1 defects for double charging:** The safeguards are explicit in code.
