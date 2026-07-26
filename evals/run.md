# Running the evals

This documents the actual workflow for grading a run of the Assumptions
skill against `evals/cases.json`, and what `evals/score.py` can and can't
automate.

## What's automated

`evals/score.py` deterministically:

- checks every `required: true` expected finding was matched (no P0
  silently dropped),
- checks each matched finding's `status` / `confidence` fall within the
  fixture's allowed set (catches over-confidence, e.g. `Unprotected` +
  `High` where `Unknown` was required),
- checks evidence references the right file(s),
- computes `weighted_recall` and `precision` per `evals/rubric.md`'s
  formulas,
- exits non-zero under `--gate` if a required finding is missed or
  recall falls below `--min-recall` (default `1.0`).

This gives a real, repeatable regression check for any run you've
already graded and saved as `evals/produced/<fixture>.json`.

## What's NOT automated, and why

Two steps in the P0 recommendation this scaffold responds to —
"invoke a model deterministically" and "parse the produced ledger" —
are not scripted here on purpose:

- **Invocation isn't scripted** because doing so would mean silently
  wiring an API call (and API cost) into this repo's tooling. This
  project's zero-dependency, zero-account stance (see
  [Privacy and cost](../README.md#privacy-and-cost)) is a deliberate
  choice, not an oversight — automating invocation would break it. If
  you want this, wire `evals/cases.json` into your own harness
  (e.g. a script that calls the Claude API or Claude Code non-
  interactively) and write the output into `evals/produced/`.
- **Ledger-to-JSON matching isn't scripted** because deciding whether a
  produced Markdown finding corresponds to an expected finding requires
  judging "same underlying assumption, evidence basis, and consequence"
  (the rubric's own standard) — a semantic call, not a mechanical one.
  An LLM grader can do this reliably; a regex can't.

## Manual / semi-automated workflow

1. Run the skill against a fixture (see `evals/cases.json` for the
   `input_files` and `must_hit_priorities` per case):
   ```
   Use Assumptions to review fixtures/duplicate-checkout/checkout.ts
   ```
2. Grade the produced ledger against `fixtures/duplicate-checkout/EXPECTED_FINDINGS.md`
   using `evals/rubric.md`'s hit/partial/miss definitions — by hand, or
   by asking an LLM grader to do it (this is what produced
   `evals/results/v0.3-grade.md` in earlier runs).
3. Translate the graded result into `evals/produced/<fixture>.json`
   (see `evals/schema.md` for the format) — one entry per produced
   finding, with `matches` pointing at the expected finding's `id`, or
   `null` for an unmatched extra finding.
4. Score it:
   ```
   python3 evals/score.py evals/produced/duplicate-checkout.json
   ```
5. To check all fixtures at once and fail loudly on a regression:
   ```
   python3 evals/score.py evals/produced/*.json --gate
   ```

## Using this in CI

`.github/workflows/evals.yml` runs `score.py --gate` against whatever
`evals/produced/*.json` snapshots are checked into the repo. This
catches a regression if someone edits `SKILL.md` and re-runs the
grading workflow above, producing a new snapshot that scores worse than
a previously-passing one — it does NOT run a live model in CI. Committing
an updated `evals/produced/*.json` after re-grading is currently a
manual step (see "What's NOT automated" above).
