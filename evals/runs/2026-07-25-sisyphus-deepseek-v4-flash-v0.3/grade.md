# Grade: 2026-07-25-sisyphus-deepseek-v4-flash-v0.3

Grader: self (same agent/session that produced the ledgers — see
manifest.json `grader_independent: false`)
Method: read each ledger against its fixture's `EXPECTED_FINDINGS.md` /
`test-notes/EXPECTED.md`, judged per `evals/rubric.md`'s hit/partial/miss
standard.

## duplicate-checkout

| Expected finding | Priority | Result | Notes |
|---|---|---|---|
| No idempotency key on payment | P0 | Hit | Unprotected/High, evidence at checkout.ts:8-11 |
| Partial failure between charge and order | P1 | Hit | Unprotected/High |
| No reconciliation/observability | P2 | Hit | Unprotected/Medium — missed in v0.2, caught here |

Precision violations: none. `amount` validation correctly labeled
Unknown/Low (was Unprotected/High in v0.2).
weighted_recall: 1.0 · precision: 1.0

## migration-rollout

| Expected finding | Priority | Result | Notes |
|---|---|---|---|
| NOT NULL column fails on existing rows | P0 | Hit | |
| Worker crashes on pre-migration/null rows | P0 | Hit | Correctly P0 (was P1 in v0.2) |
| No expand/contract for rollout safety | P1 | Hit | Correctly P1 with explicit framing (was P2 in v0.2) |

Precision violations: none.
weighted_recall: 1.0 · precision: 1.0

## tenant-leak

| Expected finding | Priority | Result | Notes |
|---|---|---|---|
| No tenant scope in query, two-part status split | P0 | Hit | Query-level Unprotected/High, system-level Unknown/Low — split lives in the status cell itself, not just Unknowns (a v0.2 presentational nuance now fixed) |

Precision violations: none. ID guessability correctly raised as its own
Unknown row rather than merged into the P0.
weighted_recall: 1.0 · precision: 1.0

## queue-redelivery

| Expected finding | Priority | Result | Notes |
|---|---|---|---|
| Side effect before ack, no dedup | P0 | Hit | Correctly Medium confidence (was High in v0.2) — the observed-vs-inferred test fired |
| No idempotency key for email provider | P2 | Hit | Missed in v0.2, caught here |

Precision violations: none.
weighted_recall: 1.0 · precision: 1.0

## refund-order

| Expected finding | Priority | Result | Notes |
|---|---|---|---|
| No idempotency on Stripe refund (unchanged by diff) | P0 | Hit | |
| Ownership check depends on req.user population | P1 | Hit | Unknown/Low, not overclaimed as Protected |
| No regression test added | P2/P3 | Hit | Missed in v0.2, caught by step-6 completeness pass |

Precision violations: none. Ownership check correctly credited as
Partially protected, not reported as still fully Unprotected.
Out-of-scope files (stripe-webhook.ts, migration) correctly excluded.
weighted_recall: 1.0 · precision: 1.0

## Aggregate

| Fixture | Expected P0/P1 | Hits | Partials | Misses | Precision violations | Weighted recall | Precision |
|---|---|---|---|---|---|---|---|
| duplicate-checkout | 2 | 3 | 0 | 0 | 0 | 1.0 | 1.0 |
| migration-rollout | 3 | 3 | 0 | 0 | 0 | 1.0 | 1.0 |
| tenant-leak | 1 | 1 | 0 | 0 | 0 | 1.0 | 1.0 |
| queue-redelivery | 1 | 2 | 0 | 0 | 0 | 1.0 | 1.0 |
| refund-order | 2 | 3 | 0 | 0 | 0 | 1.0 | 1.0 |

All five fixtures scored 1.0 weighted recall and 1.0 precision — this
is a **self-graded** result (see manifest.json). Per
`evals/runs/README.md`'s independent-grading requirement, this run
alone does not certify these numbers for `README.md`'s headline
Benchmarks table without a second, independently-graded run or a
second-model replication.

See `evals/BASELINE.md` for the full narrative history (v0.1 → v0.2 →
v0.3) this run corresponds to, and `evals/results/v0.3-grade.md` /
`evals/results/v0.3-reverify.md` for the original (non-archived-format)
writeups this entry was backfilled from.
