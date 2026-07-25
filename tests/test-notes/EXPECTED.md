# Expected findings — staged diff (src/billing/refund.ts)

Written BEFORE running the skill, to keep this a blind test.

## Should be flagged

1. P0 — No idempotency key on stripe.refunds.create(). A retry or
   double-click issues two refunds for the same order. This is
   UNCHANGED by the diff — should still be Unprotected.
2. P1 or P2 — The new ownership check compares order.userId to
   req.user.id, but req.user is never shown to be populated/verified
   in this file. If authentication middleware isn't inspected or
   doesn't exist in this repo, the check's real protection is
   Unknown, not Protected, unless the skill finds evidence auth
   middleware runs first.
3. P2/P3 — No test added alongside the ownership check.

## Should NOT be flagged as high-confidence defects

- The ownership check itself should be credited as a safeguard for
  the cross-tenant read/refund risk specifically (Partially protected
  or Protected, depending on whether auth middleware evidence is
  found) — not reported as still fully Unprotected, since the diff
  visibly adds this check.

## Out of scope for this diff (staged file is refund.ts only)

- stripe-webhook.ts issues (ordering, no signature check) — only
  relevant if the skill is asked to review that file too.
- db/002_add_org_id.sql migration issue — separate file, already
  committed in the baseline, not part of this staged diff.
