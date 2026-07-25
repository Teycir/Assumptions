# v0.1 baseline

Model / host: Claude (chat interface, manual investigation), 2026-07-25
Method: the fixture code and `SKILL.md` were read directly and the
Investigation procedure was followed manually to produce a ledger for
each fixture, independently of `EXPECTED_FINDINGS.md`. Each ledger was
then graded against its fixture's `EXPECTED_FINDINGS.md` using the
scoring rules in `rubric.md`.

This is a single manual run by one reviewer (not the fixture author),
not an automated benchmark, and not a run through an actual Claude Code
skill invocation. Treat it as a first data point, not a certification.

## Results

| Fixture | Expected P0/P1 findings | Hit | Partial | Miss | Precision violations |
|---|---:|---:|---:|---:|---:|
| duplicate-checkout | 2 (1 P0, 1 P1) | 3 | 0 | 0 | 0 |
| migration-rollout | 3 (2 P0, 1 P1) | 3 | 0 | 0 | 0 |
| tenant-leak | 1 (1 P0) | 1 | 0 | 0 | 0 |
| queue-redelivery | 1 (1 P0) | 2 | 0 | 0 | 0 |

"Expected P0/P1 findings" counts only P0/P1 rows in each
`EXPECTED_FINDINGS.md`; the Hit column counts all findings produced
(including P2s) that matched an expected entry.

weighted_recall = (hits + 0.5*partials) / (hits + partials + misses) = 1.0 on all four fixtures
precision       = supported_nonfiller_findings / total_findings_reported = 1.0 on all four fixtures

## What this run does and doesn't show

- It shows the skill's written procedure is followable and produces the
  right shape of output (correct locators, correct status/evidence-
  confidence splits, correct priority assignment) when applied carefully
  by a capable reader.
- It does **not** show how a specific agent host (e.g. Claude Code
  invoking `SKILL.md` as an actual installed skill, unattended) performs
  in practice — that run would need to be done through the real
  invocation path, not read-and-reason-through-by-hand as done here.
- The fixtures are small and single-file/two-file; this run says nothing
  about oversized-scope handling (the review-plan behavior for >15-file
  diffs), which none of the four fixtures exercise.
- Precision is 1.0 partly because these are curated fixtures with a small,
  well-defined set of expected findings — a noisier real-world diff would
  be a harder test of over-flagging discipline.

## Known weaknesses to watch for in future runs

- Provider/infrastructure semantics (webhook ordering, queue delivery
  guarantees, deployment ordering) are easy to over-infer as `High`
  confidence; the queue-redelivery fixture is a specific trap for this
  and should keep being checked in every future run.
- Tenant/authorization findings need the two-part status split (query-
  level vs. system-level) modeled in `tenant-leak`; a naive run could
  collapse this into a single overconfident `Protected` or `Unprotected`.

## Next steps to strengthen this baseline

- Re-run through an actual Claude Code (or other host) skill invocation
  of `SKILL.md` against these same fixtures, without the fixtures'
  `EXPECTED_FINDINGS.md` in context, and compare.
- Add 1-2 larger, multi-file fixtures to exercise oversized-scope
  handling and the review-plan output.
- Have a second reviewer independently grade the same ledger outputs to
  check for grader bias, since this run was scored by the same reviewer
  who produced the ledgers.
