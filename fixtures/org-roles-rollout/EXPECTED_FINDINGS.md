# Expected findings: org-roles-rollout

This fixture is the oversized-scope (>15 changed files) test case. It
exercises a code path none of the other five fixtures touch: the
"Oversized scope" / "Two-stage output" branch of the Investigation
procedure in `SKILL.md` step 1.

## Expected review plan (required output, checked before the ledger)

Per `SKILL.md`'s "Two-stage output for oversized scope," the skill must
output a review plan **before** any findings, naming what it selected
and what it excluded. A correct plan looks like this in substance (exact
wording will vary):

```
## Review plan

High-risk paths selected:
- db/003_add_role_column.sql (migration)
- src/middleware/require-admin.ts (authorization)
- src/routes/admin/delete-org.ts (new authenticated endpoint)
- src/workers/role-sync-worker.ts (background job touching the same column)

Excluded for this pass:
- UI-only files (src/ui/*.tsx, src/ui/styles/*.css, src/ui/icons/*.svg)
- Generated client files (src/generated/*)
- UI snapshot test (tests/ui/RoleBadge.test.tsx)
- Documentation (docs/roles.md)
- Dependency/version bump (package.json)
```

### What a correct plan must get right

- **All four high-risk files selected**, not a subset. Missing the
  worker specifically is the most likely partial failure — it's easy to
  select the migration + middleware + endpoint (the more obviously
  "security-shaped" three) and stop there, missing that the worker is a
  second, independently-risky consumer of the same nullable column.
- **Every excluded file named or grouped with a stated reason**, not a
  silent drop. "17 files changed, reviewing the important ones" without
  listing what was excluded is a fail on this fixture regardless of
  whether the ledger findings below are otherwise correct — this is the
  literal behavior `SKILL.md` warns against ("do not sample arbitrarily").
- **The plan appears before the ledger**, not folded into the Unknowns
  section afterward.

## Expected ledger findings (for the selected high-risk subset)

### P0 — Nullable role column has no backfill, and two independent consumers mishandle NULL differently

- **Assumption:** Every user row has a non-null `role` value by the
  time authorization or role-sync logic runs against it.
- **Evidence:** `db/003_add_role_column.sql` adds `role` as nullable
  with no backfill statement. `src/middleware/require-admin.ts` treats
  `role !== 'admin'` as a denial (NULL is denied — arguably safe-by-
  default, but denies real admins too, with no distinct signal).
  `src/workers/role-sync-worker.ts` treats a falsy `role` as "skip,
  don't sync" with no logging — a silent, undetectable gap.
- **If false:** Freshly-migrated admins are locked out of admin routes
  with no differentiated error, AND are silently excluded from the SSO
  role sync with no log trail — two different failure modes from one
  root cause, in two different files.
- **Status:** Unprotected — no backfill found in the migration; neither
  consumer distinguishes "role not yet set" from "role legitimately
  denied/absent."
- **Falsification test:** Run the migration against a seeded `users`
  table, then call `requireAdmin` and `syncRoles` against an
  unbackfilled row; observe a 403 with no distinguishing detail and a
  silent skip with no log line.
- **Evidence confidence:** High — both consumer files were read directly
  and both branches are directly observable, not inferred.
- **This is the fixture's core signal.** A correct ledger should either
  report this as one P0 finding spanning both consumer files, or as two
  P0 findings that are explicitly cross-referenced as sharing the same
  root cause (per `SKILL.md`'s rule that consequences of the same
  rollout aren't ranked lower than their root cause, and aren't treated
  as unrelated). Reporting only the middleware-side denial and missing
  the worker-side silent skip (or vice versa) should be scored as a
  **partial**, not a full hit — the fixture specifically tests whether
  a hidden risk spanning more than one *selected* file is caught in
  full, not just its first-discovered half.

## Non-findings / should NOT be flagged

- Nothing from `src/ui/*`, `src/generated/*`, `tests/ui/*`,
  `docs/roles.md`, or `package.json` should appear as a ledger entry.
  If any excluded file's content is referenced as evidence, that's a
  fabrication — this fixture never provides real source for those
  files (see `DIFF_MANIFEST.md`), so any specific claim about their
  contents is invented.
- `delete-org.ts` itself has no additional independent risk beyond
  inheriting the middleware's gap — do not double-count a second P0 for
  the endpoint file alone unless it identifies something the middleware
  and worker findings don't already cover (e.g. no confirmation step
  before an irreversible org deletion would be a legitimate *additional*
  finding, but a lower priority than the access-control gap).
