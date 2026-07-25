---
name: assumption-ledger
description: >
  Generate an evidence-backed Assumption Ledger for a Git diff, feature,
  endpoint, worker, migration, or code path. Use when reviewing a change,
  asking what could break, preparing a release, finding edge cases, assessing
  deployment safety, analyzing retries or concurrency, or designing
  failure-focused tests.
---

# Assumption Ledger

## Purpose

Identify the conditions a change silently depends on in order to work safely
in production.

Produce a structured ledger of:
- hidden assumptions
- repository evidence
- failure modes
- existing safeguards
- falsification tests
- recommended controls
- confidence and priority

This is not a generic code review. Do not report vague concerns.

## Core standard

Only report an assumption when you can provide all of the following:

1. The assumption stated as a falsifiable condition.
2. Direct evidence from code, tests, configuration, schema, documentation,
   or the Git diff.
3. A concrete consequence if the assumption is false.
4. Existing safeguards, or an explicit statement that none were found.
5. A practical falsification test or verification step.
6. A confidence label: Verified, Likely, or Unknown.
7. A priority: P0, P1, P2, or P3.

If evidence is insufficient, write it as an `Unknown` or
`Assumption to verify`, not as a defect.

## Investigation procedure

1. Determine scope.
   - If a Git repository and uncommitted changes exist, inspect the current diff.
   - Otherwise use the file, symbol, feature description, or user question.
   - State exactly what was analyzed.
   - **Empty scope:** if no diff exists and no file, symbol, or question was
     given, ask the user what to analyze rather than guessing or scanning
     the entire repository.
   - **Oversized scope:** if the diff or requested scope spans more files
     than can be read carefully (as a guide, more than ~15 changed files),
     do not sample arbitrarily. Instead, identify the highest-risk
     subset (new endpoints, migrations, auth/payment code, concurrency-
     sensitive paths) and state explicitly which files were excluded and
     why, so the user can request a follow-up pass on the rest.

2. Map the changed behavior.
   - Identify entry points, callers, data reads/writes, side effects, external
     calls, queues, caches, feature flags, authorization checks, and tests.
   - Inspect adjacent code needed to understand the behavior.

3. Identify implied conditions.
   Look for assumptions about (category tag in brackets):
   - input validity and nullability `[input]`
   - data shape and historical records `[input]`
   - uniqueness and ownership `[security]` `[concurrency]`
   - ordering, time, and expiry `[concurrency]`
   - concurrency and atomicity `[concurrency]`
   - retries, duplicate delivery, and idempotency `[concurrency]` `[failure]`
   - partial failure and recovery `[failure]`
   - dependency availability and response behavior `[failure]`
   - migration, rollout, rollback, and version compatibility `[deploy]`
   - configuration and feature flags `[deploy]`
   - scale, pagination, and resource bounds `[failure]`
   - authorization, tenancy, and secrets `[security]`
   - observability and repair `[failure]`

   When a mode flag is given (see Modes), only pursue categories tagged
   for that mode; skip the rest unless evidence for an in-scope category
   surfaces an unavoidable out-of-scope risk (mention it briefly under
   Unknowns rather than opening a full ledger entry for it).

4. Search for evidence.
   - Read relevant tests, migrations, schemas, configuration, and documentation.
   - Search for validation, database constraints, idempotency keys, locks,
     retries, fallbacks, timeouts, metrics, alerts, and recovery paths.
   - Do not assume a safeguard is absent until relevant nearby code has been
     inspected.

5. Rank findings.
   - P0: security breach, irreversible corruption, duplicate financial action,
     or unsafe migration likely to fail rollout.
   - P1: meaningful user impact under plausible production conditions.
   - P2: a real risk that requires verification, documentation, or follow-up.
   - P3: low-impact observation or weak-evidence hypothesis.

6. Produce the ledger.
   - Prioritize high-confidence, high-impact findings.
   - Include no more than 10 entries by default.
   - If more than 10 valid findings exist, keep all P0 and P1 findings
     first (never drop a P0 to make room for a lower-priority item), then
     fill remaining slots with the highest-priority P2/P3 findings. State
     the count of findings omitted and their priorities so the user knows
     what was cut.
   - Prefer concise evidence over a broad speculative checklist.

7. Offer next steps.
   - Do not change code unless the user asks.
   - If asked to fix findings, address one ledger entry at a time and add a
     regression or falsification test where practical, using the test
     framework, file layout, and naming conventions already present in
     the repository rather than introducing a new one.

## Required output format

```
# Assumption Ledger: <scope>

**Scope:** <files, branch comparison, symbol, or feature analyzed>
**Overall risk:** <Low | Medium | High>
**Release blockers:** <count, or none found>

## Executive summary

<2-5 sentences describing the most important assumptions, evidence quality,
and recommended immediate action.>

## Ledger

| Priority | Assumption | Evidence | If false | Current protection | Falsification test | Recommended action | Confidence |
|---|---|---|---|---|---|---|---|

## Existing safeguards

- <Only safeguards actually found in the repository.>

## Required verification before release

- [ ] <Specific verification, test, or operational check.>

## Unknowns and boundaries

- <Important runtime behavior that cannot be confirmed from repository
  evidence.>
```

## Terminology

- **Verified:** Directly established by repository evidence.
- **Likely:** Strong inference from code; runtime behavior is not fully known.
- **Unknown:** Cannot be determined from available evidence.
- **Assumption to verify:** The condition is meaningful and plausible but
  evidence is too thin to call it Likely or Verified. Use this instead of
  guessing a confidence level, and pair it with a concrete verification
  step rather than a falsification test if no test can settle it.
- **Assumption:** A condition that must hold for the behavior to be safe or
  correct.
- **Falsification test:** A test or procedure designed to show whether the
  assumption fails.

## What this skill must not do

- Invent business rules that do not appear in the repository or request.
- Treat every missing validation as a bug.
- Claim production behavior without evidence.
- Generate a generic "possible edge cases" checklist.
- Recommend sweeping refactors before identifying the actual risk.
- Automatically modify production-sensitive code without explicit approval.
- Label a concern "critical" merely because it sounds scary.
- Confuse an unknown external behavior with a verified flaw.

## Modes

| Command | Purpose | Categories in scope |
|---|---|---|
| `/assumptions` | Analyze the current diff or requested scope. | All |
| `/assumptions <file or symbol>` | Analyze one code path, module, endpoint, worker, or function. | All |
| `/assumptions --deploy` | Focus on migrations, rollouts, flags, version overlap, rollback, and compatibility. | `[deploy]` |
| `/assumptions --failure` | Focus on retries, partial failure, dependencies, timeouts, queues, and recovery. | `[failure]` |
| `/assumptions --concurrency` | Focus on races, duplicate delivery, locking, atomicity, and idempotency. | `[concurrency]` |
| `/assumptions --security` | Focus on identity, authorization, tenancy, secrets, trust boundaries, and data exposure. | `[security]` |
| `/assumptions --tests` | Produce falsification tests only. | All (filtering happens on output, not investigation) |
| `/assumptions --compact` | Produce a short PR-ready ledger. | All (filtering happens on output, not investigation) |

Category tags match the ones used in step 3 of the Investigation
procedure. A mode restricts which categories are investigated; it does
not change the Core standard — every reported finding still needs
evidence, a consequence, a falsification test or verification step, a
confidence label, and a priority.

### `--tests` output format

Skip the full ledger. For each finding that would otherwise appear,
output only:

```
### <Priority> — <Assumption, one line>

**Falsification test:** <concrete steps or test code>
**Proves:** <what a pass/fail result tells you>
```

Order findings P0 first. Omit Evidence, Current protection, and
Recommended action — those belong in the full ledger, not this mode.

### `--compact` output format

Produce the same investigation and the same Core standard, but render
only:

```
# Assumption Ledger: <scope> (compact)

**Overall risk:** <Low | Medium | High> · **Release blockers:** <count>

| Priority | Assumption | If false | Falsification test |
|---|---|---|---|
```

Limit to the P0 and P1 rows; summarize P2/P3 findings, if any, as a
single trailing line ("N additional lower-priority findings omitted —
run without `--compact` for the full ledger").
