# Example: `--tests` mode on the duplicate-checkout fixture

## Input

```
/assumptions-scan --tests
```

Run against `fixtures/duplicate-checkout/checkout.ts` (see
`fixtures/duplicate-checkout/EXPECTED_FINDINGS.md` for the full P0-P2
findings this fixture produces in default mode).

## Output

```
### P0 — A checkout request is processed once

**Falsification test:** Submit two identical checkout requests
concurrently (same user, same amount, same idempotency-relevant
parameters); assert exactly one Stripe charge and one order record
exist afterward.
**Proves:** Whether a client retry or double-click can create a
duplicate charge.

### P1 — Payment and order creation succeed or fail together

**Falsification test:** Force `orders.create()` to throw immediately
after a successful `stripe.charges.create()` call; observe whether the
charge is automatically refunded, retried, or left orphaned with no
matching order.
**Proves:** Whether a partial failure between the two calls leaves the
system in an inconsistent, uncorrected state.

### P2 — No reconciliation or observability path

**Falsification test:** N/A — this finding describes a missing
process/observability control, not a directly testable code path.
Verification step instead: confirm whether any job, metric, or alert
compares successful charges against created orders.
**Proves:** N/A — informs a documentation/process action rather than a
pass/fail test result.
```

## Why this is a good `--tests` example

- Findings are ordered P0 first, matching the mode's required order.
- Evidence, Status, and Recommended action are omitted, as specified for
  this mode — only the assumption, the test, and what the test proves are
  shown.
- The P2 finding has no meaningful test (it's a process gap), so the
  format is used honestly: `Falsification test: N/A` with a verification
  step offered instead, rather than inventing a fake test to fit the
  template.
