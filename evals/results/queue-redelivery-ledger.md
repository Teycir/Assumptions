# Assumptions: fixtures/queue-redelivery/worker.ts

**Scope:** `fixtures/queue-redelivery/worker.ts` (8 lines)
**Overall risk:** High
**Release blockers:** 1

## Executive summary

A queue worker that sends an email before acknowledging the message, with no dedup record and no error handling. If the queue provides at-least-once delivery (common default, unconfirmed here), a crash after send but before ack produces a duplicate email on redelivery. No provider-level idempotency key is passed to the email service either. The missing dedup is directly observable (High confidence); the likelihood that redelivery occurs is Medium since queue semantics were not confirmed.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | A redelivered message does not cause the email side effect to run more than once. | `worker.ts:6-7` — `await sendEmail(job.data.email)` runs before `await job.ack()`. No durable processing record keyed by job ID is written before or after the send. | Worker crashes after sendEmail but before ack. If the queue provides at-least-once delivery (common default), message redelivers → duplicate email sent. | Unprotected — no dedup record found in `worker.ts`. Searched: entire file. Queue config not inspected. | Kill worker after sendEmail resolves but before ack(); let message redeliver and count emails. | Add a durable processing record checked before sendEmail, or ack before send (at-most-once), or confirm queue is exactly-once. | Medium — missing dedup is High (direct observation), but the consequence depends on at-least-once delivery which is inferred, not confirmed. Per observed-vs-inferred test: consequence relies on unconfirmed external behavior → Medium overall. |
| P1 | The email provider can deduplicate duplicate submissions on its own. | `worker.ts:6` — `sendEmail(job.data.email)` passes only the recipient address; no job ID, dedup token, or idempotency key is included. | A duplicate submission reaches the email provider and two emails are sent — no provider-side dedup is leveraged. | Unprotected — no dedup token passed to email service in `worker.ts`. Searched: entire file. | Call sendEmail twice with same data and confirm two separate emails delivered. | Pass a unique dedup token or job ID to the email provider if it supports idempotency. | High — directly observed: call takes only the email address, no dedup parameter. |
| P1 | `sendEmail()` always succeeds on the first attempt. | `worker.ts:6` — `await sendEmail(...)` has no try/catch, no retry loop, no DLQ fallback. | Transient email service failure causes unhandled exception, crashing the worker or bouncing message without diagnostics. | Unprotected — no error handling found in `worker.ts`. | Simulate email provider timeout. Verify worker catches error, logs, and routes to DLQ instead of crashing. | Wrap sendEmail with retry logic and DLQ routing for persistent failures. | High — bare `await` with no error handling is directly observed. |
| P2 | Queue delivery semantics match this processing model. | `worker.ts:7` — `job.ack()` called after side effect. Queue provider and delivery mode not visible in this file. | If queue is exactly-once, risk is negligible. If at-least-once (common), crash-after-send window is real. Code is only safe under exactly-once. | Unknown — queue provider, config, and delivery semantics not visible in `worker.ts`. No queue config files found in fixture. | Check queue provider docs and deployment config for delivery guarantee. | Confirm queue delivery semantics; if at-least-once, implement dedup or switch to at-most-once. | Low — no evidence about queue tech or config exists in reviewed scope. |

## Existing safeguards

- None found in `worker.ts`. Queue config, retry policy, DLQ not inspected.

## Required verification before release

- [ ] Confirm queue technology and configured delivery semantics.
- [ ] Decide: is at-most-once acceptable for email? If so, ack before send. If not, add dedup record.
- [ ] Add error handling with retry and DLQ routing.
- [ ] Check if email provider supports idempotency keys; pass job-derived token if so.

## Unknowns and boundaries

- Queue provider and delivery config not inspected.
- DLQ configuration unknown.
- Email provider idempotency support not documented in this repo.
- Monitoring/alerting for email failures not reviewed.
