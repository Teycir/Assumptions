# Example: `--compact` mode on the duplicate-checkout fixture

## Input

```
/assumptions-scan --compact
```

Run against `fixtures/duplicate-checkout/checkout.ts` (see
`fixtures/duplicate-checkout/EXPECTED_FINDINGS.md` for the full P0-P2
findings this fixture produces in default mode).

## Output ledger

```
# Assumptions: checkout.ts (compact)

**Overall risk:** High · **Release blockers:** 1

| Priority | Assumption | If false | Falsification test |
|---|---|---|---|
| P0 | A checkout request is processed once. | A client retry or double-click creates two charges for the same logical checkout. | Submit two identical checkout requests concurrently; assert exactly one charge and one order exist. |
| P1 | Payment and order creation succeed or fail together. | The customer is charged but no order record exists if `orders.create()` throws after the charge succeeds. | Force `orders.create()` to throw after a successful charge; verify whether the charge is refunded, retried, or left orphaned. |

1 additional lower-priority finding omitted — run without `--compact` for
the full ledger.
```

## Why this is a good `--compact` example

- Same investigation and same evidence standard as the default mode —
  nothing here is invented to fit the shorter format.
- Only P0/P1 rows are shown; the fixture's P2 finding ("no reconciliation
  or observability path") is summarized as a count, not dropped silently.
- No Evidence, Current protection, or Recommended action columns — those
  belong in the full ledger.
