# Eval grade: `tests/` — staged diff `src/billing/refund.ts`

**Run date:** 2026-07-25
**Method:** Assumptions skill invoked by agent against staged git diff in `tests/` (the test project).
**Fixture:** Single file staged diff (`src/billing/refund.ts`) adding an ownership check.
**Expected findings:** `tests/test-notes/EXPECTED.md`
**Graded per:** `evals/rubric.md`

---

## Per-finding scoring

| # | Expected finding | Priority | Result | Notes |
|---|---|---|---|---|
| 1 | No idempotency key on `stripe.refunds.create()` — retry/ double-click issues two refunds. | P0 | **Hit** | Correct P0, Unprotected with search scope stated. Evidence cites `refund.ts:17`. Falsification test present. Correctly notes UNCHANGED by diff. |
| 2 | Ownership check `order.userId !== req.user.id` — `req.user` not shown to be populated in this file. | P1 | **Hit** | Correct P1, Partially protected. Credits check as safeguard; flags auth middleware as Unknown with search scope. Status/confidence separate. |
| 3 | No test added alongside the ownership check. | P2/P3 | **Hit** | P2, Unprotected, search scope stated (entire repo: no test files found). |

### Expected P0/P1 recall

| Expected P0/P1 | Hit | Partial | Miss |
|---|---:|---:|---:|
| 2 | 2 | 0 | 0 |

**Weighted recall (all expected findings):**
```
weighted_recall = (3 hits + 0.5 * 0 partials) / (3 + 0 + 0) = 1.0
```

---

## Precision checks

| Violation type | Present? | Details |
|---|---|---|
| Fabricated evidence | ❌ None | All evidence cites actual file paths and line numbers found in the repo. |
| Unlabeled speculation | ❌ None | Every finding has status + evidence confidence as separate labels. No "Verified" shortcut used. |
| Status/confidence conflation | ❌ None | Status and Evidence confidence reported as two distinct columns in every ledger row. |
| Generic filler | ❌ None | Every finding tied to specific code, not vague "consider edge cases" suggestions. |
| Over-flagging | ❌ None | 4 findings for a single-file diff — well under the 10-finding ceiling. No P2/P3 crowding out P0/P1. |
| Wrong priority direction | ❌ None | P0 assigned to financial loss (idempotency), P1 to auth reliability and crash consistency, P2 to missing tests. No cosmetic issue labeled P0/P1. |

**Precision:**
```
supported_nonfiller_findings = 4 (all findings are evidence-supported, non-fabricated, non-filler)
total_findings_reported = 4

precision = 4 / 4 = 1.0
```

---

## Extra findings (not in EXPECTED.md)

**1 finding omitted from EXPECTED.md was reported:**

| Finding | Priority | Validity |
|---|---|---|
| Stripe refund + DB update not atomic — crash after Stripe success loses consistency | P1 | Legitimate risk with direct code evidence (`refund.ts:17-21`, sequential calls, no transaction). Not over-flagging — real P1. |

This finding is a genuine concern that fits the skill's scope (partial failure / [failure]). Its inclusion does not reduce precision since it is evidence-supported and non-filler.

---

## Executive summary assessment

The produced executive summary correctly identifies the highest-risk item (P0 — idempotency gap) first, states the overall risk as High, and gives the release blocker count. It accurately characterizes the ownership check as "meaningful" but "partially protected."

---

## Final scores

| Metric | Score |
|---|---|
| Expected P0/P1 weighted recall | 1.0 |
| All-finding weighted recall | 1.0 |
| Precision | 1.0 |
| Precision violations | 0 |

**Verdict: PASS** — all expected findings hit, no precision violations. The extra P1 atomicity finding is a valid addition, not over-flagging.
