# Contributing to Assumptions

This project stays intentionally small. The value is in a disciplined
method and a trustworthy output format, not in feature surface area.

## Ways to contribute

### 1. Add an example ledger

Drop a new file in `examples/` showing a realistic diff (or diff summary)
and the ledger it should produce. Keep it short enough to read in under a
minute. Name it `NN-short-description.md` following the existing pattern.

### 2. Add a fixture

Fixtures live in `fixtures/<name>/` and pair a small, self-contained code
sample with a documented list of expected findings. A good fixture:

- Is small enough to read in full (under ~50 lines of source).
- Contains one or two clear, provable hidden assumptions.
- Includes an `EXPECTED_FINDINGS.md` describing what the skill should
  surface, including priority and confidence.

Existing fixtures are deliberately written as minimal pseudo-code: names
like `app`, `db`, `req`, `Job`, or `ExportRow` are used without imports or
type definitions. This is intentional — fixtures exist to be read in a
few seconds, not compiled. Do not "fix" this by adding imports or
scaffolding unless a new fixture specifically needs to demonstrate a
behavior that only shows up in real, runnable code (e.g. an actual test
suite catching a regression).

### 3. Improve the taxonomy or risk model

If you find a category of hidden assumption that recurs across real
incidents and isn't covered by `SKILL.md`, open an issue or PR describing:

- The category.
- A concrete example of an assumption in that category.
- Why existing categories don't already cover it.

### 4. Run and extend the evals

`evals/cases.json` holds benchmark cases; `evals/rubric.md` explains how to
grade a ledger against expected findings. Contributions that improve
grading precision (fewer false positives graded as correct, fewer real
findings missed) are especially valuable.

## Ground rules

- Every fixture and example must be evidence-based: findings should map to
  something literally present in the sample code, not an imagined business
  rule.
- Do not add findings just because they sound plausible. If evidence is
  weak, the correct label is `Unknown` or `Assumption to verify`, not a
  confident defect.
- Keep additions self-contained. Avoid growing `SKILL.md` itself unless the
  change improves precision for a wide range of cases.
