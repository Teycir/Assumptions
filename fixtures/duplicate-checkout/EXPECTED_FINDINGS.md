# Expected findings: duplicate-checkout

## P0 — No idempotency key on payment creation

- **Evidence:** `stripe.charges.create()` is called with no `idempotencyKey`
  option; `orders.create()` has no unique constraint tying it to a specific
  request.
- **If false:** A client retry (or double-click) creates two charges for
  the same logical checkout.
- **Falsification test:** Submit two identical checkout requests
  concurrently; assert exactly one charge and one order exist.
- **Confidence:** Verified

## P1 — Partial failure between payment and order creation

- **Evidence:** The Stripe charge is created and only afterward is
  `orders.create()` called; no transaction or compensating action wraps
  the two calls.
- **If false:** The customer is charged but no order record exists if
  `orders.create()` throws (e.g. a database outage) after the charge
  succeeds.
- **Falsification test:** Force `orders.create()` to throw after a
  successful `stripe.charges.create()` call; verify whether the charge is
  refunded, retried, or left orphaned.
- **Confidence:** Verified

## P2 — No reconciliation or observability path

- **Evidence:** No logging, metric, or alert is present around a mismatch
  between successful charges and created orders.
- **If false:** An orphaned charge (paid but no order) goes undetected
  until a customer complains.
- **Falsification test:** N/A — this is a process/observability gap, not a
  directly testable code path.
- **Confidence:** Likely

## Non-findings (should NOT be reported as high-confidence defects)

- Whether the payment amount is validated server-side is not shown in this
  fixture and should be marked `Unknown`, not assumed broken.
