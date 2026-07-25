# Blind run grade — 2026-07-25

**Model / host:** Sisyphus (DeepSeek V4 Flash), direct procedure following
**Method:** `SKILL.md` was read and the Investigation procedure (steps 1-6)
was applied to each fixture. `EXPECTED_FINDINGS.md` / `EXPECTED.md` files
were **not** read before or during ledger production — grading happened
after all five ledgers were finalized.

This simulates an unattended agent invocation where only `SKILL.md` and the
fixture code are available.

---

## Fixture 1: duplicate-checkout

| Metric | Value |
|---|---|
| Expected P0/P1 | 2 (1 P0, 1 P1) |
| Hits | 2 |
| Partials | 0 |
| Misses | 1 |
| Precision violations | 1 |
| **Weighted recall** | **0.67** |
| **Precision** | **0.80** |

**Hits:**
1. P0 — Duplicate payment on retry (no idempotency key). ✓
2. P1 — Partial failure between charge and order creation. ✓

**Misses:**
- P2 — No reconciliation/observability path for orphaned charges. Not flagged.

**Precision violations:**
- **Unlabeled speculation:** The `req.body.amount` validation entry (P1, Unprotected, High) overstates what the fixture shows. The fixture does not show whether server-side validation exists elsewhere — correct status should be `Unknown`, not `Unprotected`. This is the exact non-finding the expected findings call out.

**Comparison to baseline:** Baseline had 1.0/1.0. This run drops to 0.67/0.80 due to the extra speculative finding and one missed P2.

---

## Fixture 2: migration-rollout

| Metric | Value |
|---|---|
| Expected P0/P1 | 3 (2 P0, 1 P1) |
| Hits | 1 |
| Partials | 2 |
| Misses | 0 |
| Precision violations | 1 |
| **Weighted recall** | **0.67** |
| **Precision** | **1.0** |

**Hits:**
1. P0 — NOT NULL column with no default fails on existing rows. ✓

**Partials:**
2. P0 — Worker assumes migration has fully completed. Identified and evidenced correctly, but labeled **P1** instead of **P0** (wrong priority direction). The expected finding classifies a worker crash on pre-migration rows as a release blocker — matching the P0 of the migration failure itself.
3. P1 — No expand/contract pattern for rollout/rollback safety. Identified but framed as "migration fully rolled out before new worker code" at **P2** instead of P1, and without the explicit expand/contract framing.

**Precision violations:**
- **Wrong priority direction:** The worker-migration-compatibility finding is P0 per expected but was labeled P1. A crash-on-startup condition for the worker after deploy is genuine release-blocker territory.

**Comparison to baseline:** Baseline had 1.0/1.0. This run drops to 0.67/1.0 due to priority misgrading on the second P0 and partial coverage on the expand/contract finding.

---

## Fixture 3: tenant-leak

| Metric | Value |
|---|---|
| Expected P0/P1 | 1 (1 P0) |
| Hits | 1 |
| Partials | 0 |
| Misses | 0 |
| Precision violations | 0 |
| **Weighted recall** | **1.0** |
| **Precision** | **1.0** |

**Hits:**
1. P0 — No tenant scope in the query (IDOR/cross-tenant data exposure). ✓

**Calibration note:** The status cell says `Unprotected` for the query level, which matches the expected findings. The system-level caveat (middleware/RLS might protect elsewhere) is present in the Unknowns section. Expected wants this in the status cell itself as a two-part label. This is a presentational nuance, not a recall/precision issue, but worth noting for stricter adherence in future runs.

**Comparison to baseline:** Matches baseline at 1.0/1.0.

---

## Fixture 4: queue-redelivery

| Metric | Value |
|---|---|
| Expected P0/P1 | 1 (1 P0) |
| Hits | 0 |
| Partials | 1 |
| Misses | 1 |
| Precision violations | 1 |
| **Weighted recall** | **0.25** |
| **Precision** | **1.0** |

**Partials:**
1. P0 — Side effect before ack, no dedup record (duplicate email on redelivery). Identified correctly, but **evidence confidence labeled High instead of Medium**. The expected findings explicitly state that the consequence depends on the queue being at-least-once, which is the common default but is not confirmed in this fixture — so the confidence should be Medium. This is exactly the trap called out in the baseline's known weaknesses.

**Misses:**
- P2 — No idempotency key passed to the email provider itself. Not flagged. The ledger has a finding about `sendEmail` error handling and retry but misses the provider-level dedup token concern.

**Precision violations:**
- **Evidence confidence over-calibration:** P0 finding has High confidence when Medium is correct. This is a qualitative violation even though it doesn't affect the binary precision count.

**Comparison to baseline:** Baseline had 1.0/1.0. This run drops sharply to 0.25/1.0. The confidence trap that the baseline explicitly warned about was triggered.

---

## Fixture 5: tests/src/billing/refund.ts

| Metric | Value |
|---|---|
| Expected P0/P1 | 2 (1 P0, 1 P1/P2) |
| Hits | 2 |
| Partials | 0 |
| Misses | 1 |
| Precision violations | 0 |
| **Weighted recall** | **0.67** |
| **Precision** | **1.0** |

**Hits:**
1. P0 — No idempotency key on `stripe.refunds.create()`. ✓
2. P1/P2 — Ownership check depends on `req.user` being populated. ✓ (Marked as Unknown, Medium — correctly calibrated.)

**Misses:**
- P2/P3 — No test added alongside the ownership check. Not flagged. The diff adds a security fix but no regression test, which is a finding about test coverage completeness.

**Non-finding compliance:** The ownership check itself was credited as a safeguard in the Existing safeguards section. ✓ No hallucination about out-of-scope files. ✓

---

## Aggregate

| Fixture | Expected P0/P1 | Hits | Partials | Misses | Precision violations | Weighted recall | Precision |
|---|---|---|---|---|---|---|---|
| duplicate-checkout | 2 | 2 | 0 | 1 | 1 | 0.67 | 0.80 |
| migration-rollout | 3 | 1 | 2 | 0 | 1 | 0.67 | 1.0 |
| tenant-leak | 1 | 1 | 0 | 0 | 0 | **1.0** | 1.0 |
| queue-redelivery | 1 | 0 | 1 | 1 | 1 | **0.25** | 1.0 |
| tests/ refund | 2 | 2 | 0 | 1 | 0 | 0.67 | 1.0 |

**Patterns across the run:**

1. **Confidence over-calibration (most common issue):** Two fixtures (duplicate-checkout, queue-redelivery) had findings where the evidence confidence was set to High when Medium or Unknown was correct. This is the single biggest precision risk — the skill procedure explicitly warns about it but the executor still rounds up.

2. **Priority downgrading:** Migration-rollout had a genuine P0 labeled P1. The distinction matters for release-blocker declaration.

3. **Missing P2/P3 findings:** Three out of five fixtures had one lower-priority expected finding that was entirely absent. These are minor individually but indicate the search isn't exhaustive enough for the lower-priority items.

4. **Strong on core P0 hits:** The primary P0 finding was identified in every fixture where one existed (4/4 fixtures with P0s). The tenant-leak fixture achieved a perfect 1.0/1.0. The one "missed" P0 was actually a partial (identified but with wrong confidence label).

---

## Key differences from baseline

| Metric | Baseline (manual) | This run (blind) |
|---|---|---|
| duplicate-checkout recall | 1.0 | **0.67** |
| duplicate-checkout precision | 1.0 | **0.80** |
| migration-rollout recall | 1.0 | **0.67** |
| migration-rollout precision | 1.0 | 1.0 |
| tenant-leak recall | 1.0 | 1.0 |
| tenant-leak precision | 1.0 | 1.0 |
| queue-redelivery recall | 1.0 | **0.25** |
| queue-redelivery precision | 1.0 | 1.0 |

The blind run is strictly worse across all but one fixture (tenant-leak held). The queue-redelivery confidence trap was the biggest regression. This confirms the baseline's stated weakness: "not a run through an actual Claude Code skill invocation" — the gap between manual follow-along and blind procedure-following is real and measurable.

**Recommendations before sharing:**
1. Queue-redelivery needs another blind pass — the confidence calibration error is reproducible and needs a procedural guard.
2. Executive summary quality is solid (correct high-risk item identified in every fixture).
3. The five-fixture set (including tests/) should be the standard eval suite going forward.
