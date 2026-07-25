# Grading rubric

Use this rubric to grade a produced ledger against a fixture's
`EXPECTED_FINDINGS.md`.

## Per-finding scoring

For each expected finding, check whether the produced ledger contains a
matching entry. A match does not require identical wording — it requires
the same underlying assumption, evidence basis, and consequence.

| Score | Meaning |
|---|---|
| **Hit** | The ledger contains a finding matching the assumption, with evidence tied to the actual fixture code, a plausible failure mode, and a testable falsification step. |
| **Partial** | The ledger identifies the general area of risk (e.g. "no idempotency") but is missing evidence, a falsification test, or materially understates/overstates priority or confidence. |
| **Miss** | The expected finding does not appear in the ledger at all. |

## Precision checks (penalize these)

- **Fabricated evidence:** A finding cites code, a config value, or a test
  that does not exist in the fixture.
- **Unlabeled speculation:** A finding presents an unverified claim as
  `Verified` when the fixture provides no such evidence (should be
  `Likely`, `Unknown`, or `Assumption to verify`).
- **Generic filler:** A finding is vague enough to apply to almost any
  code change (e.g. "consider edge cases," "add more tests" with no
  specific evidence or test).
- **Over-flagging:** More than ~10 findings for a small fixture, or
  multiple low-value findings crowding out the fixture's actual P0/P1
  items.
- **Wrong priority direction:** A cosmetic or low-impact issue labeled
  P0/P1, or a genuine release-blocking issue labeled P2/P3.

## Scoring a run

For a given fixture:

```
recall    = hits / (hits + partials*0.5 + misses)
precision = 1 - (fabrications + unlabeled_speculation + generic_filler) / total_findings_reported
```

A good run should have high recall on the documented `P0`/`P1` findings in
particular — missing a P0 is worse than missing a P2 or P3.

## Aggregate reporting

When grading across all fixtures in `evals/cases.json`, report:

- Per-fixture hit/partial/miss counts for P0 and P1 findings specifically.
- Any precision violations (fabrication, unlabeled speculation, generic
  filler, over-flagging, wrong-priority-direction) with the offending
  finding quoted.
- A short qualitative note on whether the executive summary correctly
  identified the highest-risk item.
