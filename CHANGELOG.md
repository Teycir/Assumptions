# Changelog

All notable changes to this project are documented here. The format
follows [Keep a Changelog](https://keepachangelog.com/) conventions.

---

## [1.0.0] — 2026-07-26

### Added
- README Benchmarks section documenting the full eval suite, per-fixture
  descriptions, results table across v0.1–v0.3, and key takeaway about
  evidence-confidence calibration.
- `evals/results/v0.3-grade.md` — per-fixture grade breakdown from a full
  blind re-run against the patched SKILL.md, all five fixtures at 1.0
  recall and 1.0 precision.
- `evals/BASELINE.md` updated with v0.3 full-blind-run results alongside
  v0.1 and v0.2, with fix-to-regression mapping table.

### Changed
- README restructured: Benchmarks inserted between Limits and Repository
  layout sections.

## [0.4.0] — 2026-07-26

### Added
- New ledgers for `refund-order`, `tenant-leak`, and `tests/refund`
  fixtures.

### Fixed
- **Evidence-confidence calibration** — SKILL.md gained an
  "observed-vs-inferred test" decision rule with example table
  (queue semantics, upstream validation, auth middleware, SDK defaults)
  to prevent rounding up inferred behavior to `Unprotected`/`High`.
- **P0 ranking clarification** — a rollout's failure is P0 whether it
  appears in the migration itself or in the first consumer that crashes
  on the changed shape; a consequence is not ranked lower than its root
  cause.
- **Completeness pass in step 6** — mandatory re-scan of in-scope
  categories for P2/P3 items before finalizing, since finding a P0 tends
  to stop the search early.

### Changed
- Re-verified all three regressed fixtures (queue-redelivery,
  migration-rollout, duplicate-checkout) against the patched SKILL.md
  — all returned to 1.0/1.0.

## [0.3.0] — 2026-07-25

### Added
- Evaluation scripts (`scripts/run-evals.sh`) and initial eval results
  directory (`evals/results/`).
- Local test suite under `tests/` with billing and webhook test sources,
  database migration scripts, and `EXPECTED.md` for blind verification.
- SVG banner assets (`assets/banner.svg`) replacing ASCII art header.
- Centered demo video section with YouTube thumbnail in README.

### Changed
- README fully redesigned with navigation menu, badge suite, Mermaid
  flowchart for the analysis pipeline.
- Table of Contents moved below intro; anchor links fixed.

## [0.2.0] — 2026-07-25

### Added
- 7 example ledgers: duplicate payment, unsafe migration, cross-tenant
  access, webhook ordering, cache staleness, compact mode, tests mode.
- Demo assets: `assets/demo.gif`, promotional video under `video/`.
- Agent instructions (`CLAUDE.md`, `AGENTS.md`) for repository-level
  convention to run the skill before non-trivial commits.
- Pre-commit reminder hook (`scripts/assumptions-precommit`).
- Use cases table and support-development section in README.
- Badge suite (license, Claude Code compatibility, privacy, zero
  dependencies, evidence-backed, falsification tests).
- ETH donation wallet and QR code asset.

### Changed
- Project renamed from "Assumption Ledger" to "Assumptions".
- Invocation command changed from `/assumptions` to `/assumptions-scan`
  to avoid colliding with the project name.
- Repositioned as agent-agnostic (was described as Claude Code-only).
- Protection status and evidence confidence decoupled into separate
  labels: **Status** (Protected / Partially protected / Unprotected /
  Unknown) and **Evidence confidence** (High / Medium / Low).
- All examples, fixtures, and expected findings updated to the new
  schema with mandatory file/line locators.

## [0.1.0] — 2026-07-25

### Added
- Initial release of the Assumption Ledger skill.
- `SKILL.md`: investigation procedure, risk taxonomy with category tags,
  risk model, output formats (default, `--tests`, `--compact`), and
  scope-handling rules for empty/oversized diffs.
- 4 fixtures with documented `EXPECTED_FINDINGS.md` for benchmarking:
  duplicate-checkout, migration-rollout, tenant-leak, queue-redelivery.
- Evaluation framework (`evals/`) with benchmark cases, grading rubric,
  and `BASELINE.md`.
- README, CONTRIBUTING guide, MIT LICENSE.

---

[1.0.0]: https://github.com/Teycir/Assumptions/releases/tag/v1.0.0
