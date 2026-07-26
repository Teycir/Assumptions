# evals/runs/ — reproducibility archive

This directory preserves the **raw output** of every graded skill run,
one file per run, in full — as opposed to `evals/results/` (a loose,
inconsistently-named collection of ledgers from early runs, kept for
history but not the source of truth going forward) and
`evals/produced/*.json` (the minimal machine-scoreable extraction
`score.py` reads, with no provenance metadata).

`evals/runs/` is the missing link between the two: it makes a scored
result in `evals/produced/` traceable back to the exact conditions that
generated it, months later, by someone who wasn't in the room.

## Why this exists

`BASELINE.md` v0.1–v0.3 candidly note two limits on what the existing
runs can support as evidence:

- v0.1 was self-graded — the same reviewer wrote the ledgers and scored
  them.
- v0.2 and v0.3 were blind-produced but still graded by the same agent
  that generated the ledger.

Neither limitation is fixed by better scoring automation — `score.py`
was already deterministic once a `matches` field is filled in. What was
missing was a durable record of *how* a ledger was produced, so a
skeptical reader (or a future contributor re-running the suite) can
tell what changed between two scores: the model, the host, the exact
`SKILL.md` revision, the exact fixture revision, and whether the grader
had any prior exposure to the expected findings.

## Layout

```
evals/runs/
  <run-id>/
    manifest.json       required — provenance metadata, see below
    ledgers/
      <fixture-id>.md    raw Markdown ledger exactly as produced
    grade.md             optional — human/LLM grading notes for this run
```

`<run-id>` format: `YYYY-MM-DD-<short-model-tag>-<n>`, e.g.
`2026-07-25-sisyphus-deepseek-v4-flash-01`. The trailing `-01` disambiguates
same-day same-model runs (a re-run after a `SKILL.md` patch is a new
run-id, not an overwrite).

## `manifest.json` fields

```json
{
  "run_id": "2026-07-25-sisyphus-deepseek-v4-flash-01",
  "date": "2026-07-25",
  "model": "DeepSeek V4 Flash",
  "host": "Sisyphus (agent harness, non-interactive)",
  "invocation_method": "skill-file-read",
  "skill_md_commit": "579af7d6176a75c0f99e259de51ef110851f2661",
  "fixtures_commit": "579af7d6176a75c0f99e259de51ef110851f2661",
  "blind": true,
  "grader": "self",
  "grader_independent": false,
  "fixtures_run": ["duplicate-checkout", "migration-rollout", "tenant-leak", "queue-redelivery", "refund-order"],
  "supersedes_run_id": null,
  "notes": "Free text: what prompted this run, what changed since the last one."
}
```

Field notes:

- `invocation_method` — one of `skill-file-read` (procedure followed by
  reading `SKILL.md` directly, no real skill-loading mechanism — the
  method used for every run to date), `claude-code-skill` (invoked
  through an actual installed Claude Code skill), or
  `agent-harness-skill` (invoked through another host's real skill/tool
  invocation path). This field exists specifically to make visible
  which runs have and have not closed the gap `BASELINE.md` names under
  "Run through an actual installed-skill invocation path" — as of this
  writing, none have; every archived run so far is `skill-file-read`.
- `skill_md_commit` / `fixtures_commit` — the exact Git commit hash of
  `SKILL.md` and the fixture files at the time of the run. Use the
  short or long hash from `git log`; do not use a branch name or tag,
  since those move. If `SKILL.md` and the fixtures weren't at the same
  commit (e.g. testing a `SKILL.md` patch against unmodified fixtures),
  record both accurately rather than collapsing them into one field.
- `blind` — `true` only if `EXPECTED_FINDINGS.md` / `EXPECTED.md` was
  never in context during ledger production for any fixture in this
  run. If any fixture in the run wasn't blind, set this `false` and
  explain per-fixture in `notes`.
- `grader` — free text identifying who/what graded the ledgers against
  expected findings (e.g. `"self"`, `"different session, same model"`,
  `"Claude Sonnet 5, no prior context"`, a human's name/handle).
- `grader_independent` — `true` only if the grader had no role in
  producing the ledgers and no prior exposure to this run's rationale
  (e.g. did not author a `SKILL.md` patch this run is meant to verify).
  See "Independent grading requirement" below for when this matters.
- `supersedes_run_id` — if this run re-runs the same fixture set after a
  `SKILL.md` or fixture change, name the prior run-id it's compared
  against, so regressions are traceable across the archive without
  relying on `BASELINE.md` prose alone.

## Independent grading requirement for baseline updates

A run with `grader_independent: false` (self-graded, or graded by the
same session/model that authored a `SKILL.md` change the run is meant
to validate) may still be archived here — self-graded runs are useful
data and shouldn't be thrown away. But a run in this state must NOT, by
itself, be used to:

- update the headline recall/precision numbers in `README.md`'s
  Benchmarks table, or
- close out a "regression fixed" claim in `BASELINE.md`.

Either of those requires at least one of:

1. A second, `grader_independent: true` run over the same fixture set
   (a different model/session/human grading the same ledgers, or
   re-producing ledgers independently and comparing), or
2. A second-model replication — the same fixtures run blind through a
   different model than the one used for the run being certified.

Until one of those exists, report the self-graded number with the
self-graded caveat attached, the way `BASELINE.md` v0.1–v0.3 already do.
This directory doesn't change that policy; it just gives it a
machine-checkable field (`grader_independent`) instead of relying on
someone remembering to write the caveat in prose each time.

## Standard scoring template (`grade.md`)

An optional per-run `grade.md` should follow this shape so grading notes
are comparable across runs without re-deriving a format each time:

```markdown
# Grade: <run-id>

Grader: <name/model, matches manifest.json "grader">
Method: <how matching was done — read both ledger and EXPECTED_FINDINGS.md,
judged per evals/rubric.md's hit/partial/miss standard>

## <fixture-id>

| Expected finding | Priority | Result | Notes |
|---|---|---|---|
| <id from evals/expected/<fixture>.json> | P0 | Hit/Partial/Miss | <why> |

Precision violations: <none, or list with the offending finding quoted>
weighted_recall: <n> · precision: <n>

## Aggregate

<table across all fixtures in this run, same shape as BASELINE.md's
per-run results tables>
```

This is the same information `evals/results/*-grade.md` already
contains for two runs — this template just makes the shape explicit and
reusable instead of ad hoc per file.

## Workflow

1. Produce ledgers per `evals/run.md`'s existing manual workflow.
2. Create `evals/runs/<run-id>/manifest.json` and
   `evals/runs/<run-id>/ledgers/<fixture-id>.md` for each fixture run.
3. Grade per `evals/rubric.md`; write `evals/runs/<run-id>/grade.md`
   using the template above.
4. Translate the graded result into `evals/produced/<fixture-id>.json`
   per `evals/schema.md`, with `run_label` set to this run's `run_id` so
   the machine-scored snapshot and the archived raw run are linked by a
   shared identifier.
5. Score with `evals/score.py` as usual.
6. Only fold results into `README.md` / `BASELINE.md` headline numbers
   once the independent-grading requirement above is satisfied.
