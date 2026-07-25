# Grading rubric

Use this rubric to grade a produced ledger against a fixture's
`EXPECTED_FINDINGS.md`.

## Per-finding scoring

For each expected finding, check whether the produced ledger contains a
matching entry. A match does not require identical wording — it requires
the same underlying assumption, evidence basis, and consequence.

| Score | Meaning |
|---|---|
| **Hit** | The ledger contains a finding matching the assumption, with evidence tied to the actual fixture code (ideally with a file/line locator), a plausible failure mode, and a testable falsification step. |
| **Partial** | The ledger identifies the general area of risk (e.g. "no idempotency") but is missing evidence, a falsification test, or materially mislabels status, evidence confidence, or priority. |
| **Miss** | The expected finding does not appear in the ledger at all. |

## Precision checks (penalize these)

- **Fabricated evidence:** A finding cites code, a config value, or a test
  that does not exist in the fixture, or cites a file/line locator that
  doesn't match the actual location of the evidence.
- **Unlabeled speculation:** A finding presents an unverified claim with a
  status of `Protected` or `Unprotected` and `High` evidence confidence
  when the fixture provides no such direct evidence (should be `Unknown`
  status, or a lower evidence confidence with the gap named).
- **Status/confidence conflation:** A finding uses a single word (e.g.
  "Verified") to describe both whether a safeguard exists and how solid
  the evidence is, instead of reporting Status and Evidence confidence
  as two separate labels.
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
