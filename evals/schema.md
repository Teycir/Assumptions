# Structured evaluation formats

This document defines the JSON schemas used by `evals/score.py` to grade
a produced ledger against a fixture's expected findings, deterministically.

It complements — not replaces — the human-readable
`EXPECTED_FINDINGS.md` / `EXPECTED.md` files in each fixture and
`tests/test-notes/`. Those remain the source of truth for *why* a
finding is expected; the JSON in `evals/expected/` is a machine-checkable
restatement of the same findings for automated grading.

## `evals/expected/<fixture>.json`

One file per case in `evals/cases.json`, named after the case `id`.

```json
{
  "fixture": "duplicate-checkout",
  "source_of_truth": "fixtures/duplicate-checkout/EXPECTED_FINDINGS.md",
  "findings": [
    {
      "id": "duplicate-checkout-idempotency",
      "priority": "P0",
      "required": true,
      "assumption_concepts": ["idempotency", "duplicate payment", "retry"],
      "status_allowed": ["Unprotected"],
      "confidence_allowed": ["High"],
      "evidence_must_reference": ["checkout.ts"]
    }
  ],
  "prohibited_claims": [
    {
      "concept": "amount validation",
      "must_not_be": {"status": "Unprotected", "confidence": "High"},
      "reason": "Server-side validation elsewhere was not inspected; correct call is Unknown or lower confidence."
    }
  ],
  "credited_safeguards": [
    {
      "concept": "ownership check",
      "credit_as": ["Protected", "Partially protected"],
      "reason": "The diff visibly adds this check and it should be credited, not ignored."
    }
  ]
}
```

Field notes:

- `findings[].id` — stable identifier, used in scoring output. Does not
  need to match anything in the produced ledger; matching against the
  produced ledger happens by `assumption_concepts` overlap plus grader
  judgment (see "Matching is not fully automatic" below).
- `findings[].required` — `true` means a `miss` on this finding is a gate
  failure regardless of the fixture's overall score (typically all `P0`
  findings, sometimes `P1`).
- `status_allowed` / `confidence_allowed` — the acceptable label(s) for a
  correctly calibrated ledger. A produced finding whose status or
  confidence falls outside this list, for a matched finding, counts as a
  **partial**, not a hit — the finding was found but mislabeled.
- `evidence_must_reference` — at least one of these file names must
  appear in the produced finding's evidence for it to count as
  evidence-backed rather than fabricated.
- `prohibited_claims` — claims the ledger must NOT make (the specific
  over-confidence traps each fixture tests for). Any produced finding
  matching a `concept` here with the listed `status`+`confidence`
  combination is a precision violation, independent of the `findings`
  list.
- `credited_safeguards` (optional) — safeguards a diff visibly adds that
  the ledger must credit; failing to credit one when evidence supports it
  is scored as a miss on precision (the ledger inappropriately treats a
  real fix as absent).
- `review_plan_required` (optional, default `false`) — set `true` for
  oversized-scope fixtures (see `SKILL.md`'s "Oversized scope" /
  "Two-stage output" rule in the Investigation procedure). When set,
  `score.py` also checks the produced JSON's `review_plan_selected` /
  `review_plan_excluded` fields, not just `findings`.
- `review_plan_must_select` (required if `review_plan_required` is
  `true`) — the file paths a correct review plan must select for the
  high-risk pass. Any path in this list missing from the produced
  `review_plan_selected` array is a gate failure under `--gate`.
- `review_plan_must_exclude_categories` (optional, documentation only —
  not mechanically checked) — the categories of files a correct plan
  should name as excluded, for a human/LLM grader's reference. `score.py`
  only checks that `review_plan_excluded` is non-empty, not that it
  matches this list exactly, since exclusion is usually stated as
  categories/globs rather than an exhaustive file list.

## `evals/produced/<fixture>.json` (per run)


Not checked into version control by default — this is what a grader
(human or scripted) fills in after reading a produced ledger, to hand to
`score.py`. A checked-in snapshot under `evals/produced/` represents one
graded run and becomes the CI regression baseline for that run.

```json
{
  "fixture": "duplicate-checkout",
  "run_label": "v0.3-blind",
  "findings": [
    {
      "matches": "duplicate-checkout-idempotency",
      "priority": "P0",
      "status": "Unprotected",
      "confidence": "High",
      "evidence_files": ["checkout.ts"]
    },
    {
      "matches": null,
      "priority": "P1",
      "status": "Unprotected",
      "confidence": "High",
      "evidence_files": ["checkout.ts"],
      "note": "extra finding not in expected list — scored on precision only"
    }
  ]
}
```

- `matches` — the `id` from the corresponding `evals/expected/<fixture>.json`
  this produced finding corresponds to, or `null` if it doesn't
  correspond to any expected finding (an "extra" finding, scored for
  precision but not recall).
- Any expected finding with no produced entry pointing at it via `matches`
  is scored as a `miss`.

### Matching is not fully automatic

Deciding which produced finding corresponds to which expected finding
still requires a human (or an LLM grader) to read both and judge "same
underlying assumption, evidence basis, and consequence" — the rubric's
own matching standard (`evals/rubric.md`). `score.py` does not attempt
semantic matching; it trusts the `matches` field and then checks the
mechanical parts (status/confidence in the allowed set, evidence
references present, required findings not missing, prohibited claims not
made). This keeps the scorer honest about what it can and can't verify
automatically — see `evals/run.md` for the full workflow.
