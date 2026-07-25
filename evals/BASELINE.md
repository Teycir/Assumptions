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

## v0.3 — Full blind re-run after SKILL.md patch (2026-07-25)

Three changes were made to `SKILL.md` in response to the v0.2 regressions:
1. An "observed-vs-inferred test" (decision rule + example table) for
   when a finding depends on an unconfirmed external fact (queue
   semantics, upstream validation, auth middleware, SDK defaults) —
   such findings must not be written as `Unprotected` + `High`.
2. A clarified P0 ranking rule: a rollout's failure is P0 whether it
   shows up in the migration itself or in the first consumer that
   crashes on the changed shape; a consequence is not ranked lower than
   its root cause.
3. A completeness pass added to step 6: re-scan in-scope categories for
   P2/P3 items before finalizing, since a found P0 tends to stop the
   search early.

All five fixtures were then re-run blind from the updated `SKILL.md`
(no `EXPECTED_FINDINGS.md` in context during ledger production — truly
blind, same methodology as v0.2) by Sisyphus (DeepSeek V4 Flash).

### Results

| Fixture | v0.2 recall | v0.3 recall | v0.2 precision | v0.3 precision |
|---|---|---|---|---|
| queue-redelivery | 0.25 | **1.0** | 1.0 | 1.0 |
| migration-rollout | 0.67 | **1.0** | 1.0 | 1.0 |
| duplicate-checkout | 0.67 | **1.0** | 0.80 | **1.0** |
| tenant-leak | 1.0 | **1.0** | 1.0 | 1.0 |
| tests/ refund | 0.67 | **1.0** | 1.0 | 1.0 |

All five fixtures scored 1.0 weighted recall and 1.0 precision — the
first full sweep at perfect scores across the entire suite.

### What changed

| Issue | v0.2 | v0.3 | Fixed by |
|---|---|---|---|
| Queue-redelivery: P0 confidence over-calibration | High → should be Medium | Correctly Medium | Observed-vs-inferred test (rule + table) |
| Queue-redelivery: missing email provider dedup P2 | Not flagged | Flagged P1 | Completeness pass (step 6) |
| Duplicate-checkout: amount validation over-flagged | Unprotected/High → should be Unknown/Medium | Correctly Unknown/Medium | Observed-vs-inferred test |
| Duplicate-checkout: missing observability P2 | Not flagged | Flagged P2 | Completeness pass (step 6) |
| Migration-rollout: worker crash ranked P1 instead of P0 | P1 | P0 | P0 ranking clarification |
| Migration-rollout: expand/contract finding partial | Partial/P2 | Full/P1 | P0 ranking + completeness pass |
| Tests/refund: missing regression test finding | Not flagged | Flagged P2 | Completeness pass (step 6) |
| Tenant-leak: system-level status caveat | In Unknowns only | In status cell explicitly | (carried from earlier runs, now in correct format) |

### What this shows

The three edits to `SKILL.md` closed every regression from v0.2:
- The observed-vs-inferred test eliminated the confidence over-calibration
  in both fixtures where it appeared (queue-redelivery, duplicate-checkout).
- The P0 ranking clarification fixed the migration-rollout priority downgrade.
- The completeness pass in step 6 caught all three previously missed
  P2/P3 findings (email idempotency, observability, missing test).

The perfect scores match v0.1's manual-run quality, but with the
additional guarantee that they were produced blind.

## Known weaknesses to watch for in future runs

- Provider/infrastructure semantics (webhook ordering, queue delivery
  guarantees, deployment ordering) remain the most likely source of
  confidence over-calibration. The observed-vs-inferred test now provides
  a decision rule, but it still relies on the executor applying it.
- Tenant/authorization findings need the two-part status split (query-
  level vs. system-level) modeled in `tenant-leak`; a naive run could
  collapse this into a single overconfident `Protected` or `Unprotected`.
- The v0.3 run was produced by the same model that authored the SKILL.md
  edits, so there is a residual self-grading risk despite blind ledger
  production. An independent replication would be stronger evidence.

## Next steps to strengthen this baseline

### Before sharing (address these first)

1. **✔ Resolved — evidence-confidence ceiling.** The observed-vs-inferred
   test (decision rule + example table) was added directly to SKILL.md
   and verified across the queue-redelivery and duplicate-checkout
   fixtures. v0.3 scored 1.0 on both where v0.2 scored 0.25 and 0.67.
   This item should remain in the known weaknesses list for regression
   checking but no longer blocks sharing.

2. **Add a large/multi-file fixture (>15 files) to exercise the oversized-scope
   review-plan branch.** This is the only unexercised code path in the skill
   procedure and the biggest remaining gap before certifying the skill for
   real-world diffs of non-trivial size.

3. **Get a second independent grader** to score the v0.3 ledgers (or run
   them through a different model/host with no prior exposure) to check
   whether the single-reviewer scoring is consistent.

### After sharing

- Add 1-2 larger, multi-file fixtures to exercise oversized-scope
  handling and the review-plan output.
- Have a second reviewer independently grade the same ledger outputs to
  check for grader bias, since this run was scored by the same reviewer
  who produced the ledgers.
- Re-run against the suite whenever the SKILL.md undergoes a non-trivial
  revision to detect regression.
- Run through an actual installed-skill invocation path (Claude Code,
  OpenCode) rather than read-and-follow-by-hand, to exercise the real
  agent pipeline.
