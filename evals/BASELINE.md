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

## v0.2 — Blind run (Sisyphus, 2026-07-25)

Model / host: Sisyphus (DeepSeek V4 Flash) following the SKILL.md
procedure directly, without any EXPECTED_FINDINGS.md in context during
ledger production. The ledgers were graded afterward against the expected
findings by the same agent. Five fixtures (v0.1's four + the `tests/`
fixture).

### Results

| Fixture | Expected P0/P1 | Hits | Partials | Misses | Precision violations | Weighted recall | Precision |
|---|---|---|---|---|---|---|---|
| duplicate-checkout | 2 | 2 | 0 | 1 | 1 | 0.67 | 0.80 |
| migration-rollout | 3 | 1 | 2 | 0 | 1 | 0.67 | 1.0 |
| tenant-leak | 1 | 1 | 0 | 0 | 0 | **1.0** | 1.0 |
| queue-redelivery | 1 | 0 | 1 | 1 | 1 | **0.25** | 1.0 |
| tests/ refund | 2 | 2 | 0 | 1 | 0 | 0.67 | 1.0 |

### Key differences from v0.1

- **Queue-redelivery dropped hardest:** 1.0 → 0.25 recall. The evidence-
  confidence trap (High vs Medium on the P0 finding) was triggered exactly
  as the v0.1 "known weaknesses" warned about. The email-provider
  idempotency P2 was also missed.
- **Duplicate-checkout and migration-rollout both regressed** from 1.0
  recall to 0.67, driven by one missed lower-priority finding each and
  priority misgrading.
- **Tenant-leak held at 1.0/1.0.** The system-level status caveat was
  present in Unknowns but not in the status cell itself — a presentation
  nuance, not a recall/precision defect.
- **The blind run is measurably worse than the baseline** on every fixture
  where a difference exists. This quantifies the gap that v0.1 named
  as "the skill's written procedure is followable... [but] it does not
  show how a specific agent host performs."
- **Tests/ fixture (new in v0.2):** scored 0.67 recall. Missed the "no
  test added alongside the fix" finding.

### What these results suggest

- The core P0 findings are reliably identified (P0 found in 4/4 fixtures
  where one exists). The regression is in evidence-confidence calibration
  and lower-priority exhaustiveness, not in missing the primary signal.
- Evidence-confidence over-calibration is the single most reproducible
  failure mode across this run — it appeared in two different fixtures
  and is the main precision risk.
- The skill's `--deploy` / `--failure` / `--concurrency` mode flags were
  not tested here. All fixtures used the default (all-categories) mode.

## v0.3 — Targeted re-verification after SKILL.md patch (2026-07-25)

Three changes were made to `SKILL.md` in response to the v0.2 regressions:
1. An "observed-vs-inferred test" (decision rule + table) for when a
   finding depends on an unconfirmed external fact (queue semantics,
   upstream validation, auth middleware, SDK defaults) — such findings
   must not be written as `Unprotected` + `High`.
2. A clarified P0 ranking rule: a rollout's failure is P0 whether it
   shows up in the migration itself or in the first consumer that
   crashes on the changed shape; a consequence is not ranked lower than
   its root cause.
3. A completeness pass added to step 6: re-scan in-scope categories for
   P2/P3 items before finalizing, since a found P0 tends to stop the
   search early.

The three fixtures that regressed in v0.2 were re-run (same model/session
that authored the patch, ledgers drafted from the procedure before
re-consulting each fixture's expected findings for scoring — see
`evals/results/v0.3-reverify.md` for the full method caveat).

### Results

| Fixture | v0.2 recall | v0.3 recall | v0.2 precision | v0.3 precision |
|---|---:|---:|---:|---:|
| queue-redelivery | 0.25 | **1.0** | 1.0 | 1.0 |
| migration-rollout | 0.67 | **1.0** | 1.0 | 1.0 |
| duplicate-checkout | 0.67 | **1.0** | 0.80 | **1.0** |
| tenant-leak | 1.0 | not re-run | 1.0 | not re-run |
| tests/ refund | 0.67 | not re-run | 1.0 | not re-run |

Each regression's specific failure mode was checked and confirmed fixed:
the queue-redelivery confidence trap, the migration-rollout priority
downgrade, and the duplicate-checkout Unknown-vs-Unprotected trap on the
`amount` validation question.

### What this run does not show

This is **not** a fresh blind run — it was produced by the same session
that wrote the patch, with prior exposure to these three fixtures'
expected findings earlier in the session. It's a weaker isolation
guarantee than the v0.2 run and carries more self-grading bias risk.
`tenant-leak` and `tests/refund` were not re-verified. A genuine second
data point requires a fresh model/session, blind, across all five
fixtures — see `evals/results/v0.3-reverify.md` for the full list of
remaining next steps.

## Known weaknesses to watch for in future runs

- Provider/infrastructure semantics (webhook ordering, queue delivery
  guarantees, deployment ordering) are easy to over-infer as `High`
  confidence; the queue-redelivery fixture is a specific trap for this
  and should keep being checked in every future run.
- Tenant/authorization findings need the two-part status split (query-
  level vs. system-level) modeled in `tenant-leak`; a naive run could
  collapse this into a single overconfident `Protected` or `Unprotected`.

## Next steps to strengthen this baseline

### Short-term (before sharing)

1. **Queue-redelivery confidence calibration is the weakest signal in the suite.**
   The v0.2 blind run scores 0.25 recall on this fixture because evidence
   confidence was set to High when Medium is correct — exactly the trap
   called out in v0.1's known weaknesses. A procedural guard is needed,
   possibly a mandatory "would I bet money that the default behavior is
   at-least-once?" check before assigning High confidence to queue-
   delivery inferences.

2. **Add a large/multi-file fixture (>15 files) to exercise the oversized-scope
   review-plan branch.** This is the only unexercised code path in the skill
   procedure.

3. **Get a second independent grader** to score the v0.2 ledgers and check
   whether the single-reviewer scoring is consistent.

4. **Enforce the evidence-confidence ceiling:** Before writing a High confidence
   label, the executor must verify the finding relies only on what's directly
   observable in the code, not on external behavior the fixture doesn't
   confirm.

### Longer-term

- Add 1-2 larger, multi-file fixtures to exercise oversized-scope
  handling and the review-plan output.
- Have a second reviewer independently grade the same ledger outputs to
  check for grader bias, since this run was scored by the same reviewer
  who produced the ledgers.
- Re-run against the suite whenever the SKILL.md undergoes a non-trivial
  revision to detect regression.
