# Assumptions: fixtures/queue-redelivery/worker.ts

**Scope:** `fixtures/queue-redelivery/worker.ts` (8 lines) — a queue worker that sends an email before acknowledging the message.
**Overall risk:** High
**Release blockers:** 1

## Executive summary

A minimal worker that performs a side effect (sending an email) before acknowledging the queue message. If the worker crashes between `sendEmail` and `job.ack()`, the message is redelivered and a duplicate email is sent. No idempotency key, deduplication check, or at-least-once processing guarantee exists in the reviewed code.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | A delivered message is processed exactly once. | `worker.ts:6-7` — `sendEmail()` is called before `job.ack()`. No dedup key, processing record, or idempotency check exists. The worker has no at-most-once or exactly-once guarantee. | Worker crashes after sending the email but before acking the message. Queue redelivers the message → duplicate email sent to the customer. | Unprotected — no dedup mechanism, processing log, or idempotency check found in `worker.ts`. | Simulate a worker crash after `sendEmail` completes but before `job.ack()`. Verify that on redelivery, `sendEmail` is called again for the same job. | Move `job.ack()` before the side effect (at-most-once semantics), or add a processing record (DB write with unique constraint on job ID) checked before `sendEmail`. | High |
| P1 | `job.data.email` is always a valid, deliverable email address. | `worker.ts:6` — `sendEmail(job.data.email)` passes the email address with no format validation or sanity check before sending. | A malformed, empty, or invalid email address is passed to the email sending service, potentially causing a silent failure, API error, or billing charge for a failed send. | Unprotected — no email format validation found in `worker.ts`. | Submit a job with missing `email`, empty string, or invalid format. Verify the worker validates before calling `sendEmail`. | Add email format validation before sending; reject invalid jobs to a dead-letter queue. | High |
| P1 | `sendEmail()` always succeeds. | `worker.ts:6` — `await sendEmail(job.data.email)` has no try/catch, no fallback, no retry logic, and no error routing. | The email service is temporarily unavailable or returns an error. The exception propagates unhandled, potentially crashing the worker or causing a message nack/redelivery loop without useful diagnostics. | Unprotected — no error handling, retry, or DLQ routing found in `worker.ts`. | Simulate a timeout or 5xx from the email service. Verify the worker handles the error gracefully (retries or DLQ) rather than crashing. | Wrap `sendEmail` in error handling with retry logic and DLQ routing for persistent failures. | High |
| P2 | The queue delivery semantics match the processing model. | `worker.ts:7` — `job.ack()` is called after the side effect. The queue provider's default delivery semantics (at-least-once) are not confirmed. | If the queue defaults to at-least-once delivery, every normal processing cycle already risks double delivery on the narrow window between completion and ack persistence. | Unknown — queue provider and its delivery semantics are not visible in `worker.ts`. | Check the queue provider documentation for default delivery guarantees. Consider if at-least-once is acceptable for email sending. | Document the intended delivery semantics; choose at-most-once (ack before work) or exactly-once (dedup record) explicitly. | Low |

## Existing safeguards

- None found in the reviewed scope (`worker.ts` only; no queue configuration, retry policy, or DLQ setup was inspected).

## Required verification before release

- [ ] Decide on the required delivery semantics for email sending (at-most-once or exactly-once).
- [ ] If at-most-once is acceptable, move `job.ack()` before `sendEmail()`.
- [ ] If exactly-once is required, add a deduplication record checked before sending.
- [ ] Add error handling for `sendEmail` failures with retry and DLQ routing.
- [ ] Add email format validation.

## Unknowns and boundaries

- Queue provider (SQS, RabbitMQ, Pub/Sub, etc.) and its configured delivery semantics were not inspected.
- Dead-letter queue configuration, if any, is unknown.
- Email service retry and idempotency behavior is unknown — some email providers deduplicate based on message ID.
- Monitoring and alerting for email send failures was not reviewed.
