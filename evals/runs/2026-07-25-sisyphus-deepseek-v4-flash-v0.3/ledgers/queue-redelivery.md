# Assumptions: fixtures/queue-redelivery/worker.ts

**Scope:** `fixtures/queue-redelivery/worker.ts` (8 lines) — `handleJob` sends an email then acks the queue message.
**Overall risk:** High
**Release blockers:** 1

## Executive summary

The handler performs a side effect (`sendEmail`) before acknowledging the message, with no durable record that the send happened. If the queue is at-least-once (the common default, but unconfirmed here) and the worker crashes between send and ack, the message redelivers and the email sends again. This is unprotected regardless of the queue's exact semantics, since no dedup record exists either way — but the likelihood/mechanism of redelivery depends on an external fact this file doesn't confirm, so that part is Medium confidence, not High.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | A redelivered message does not cause the email to send more than once | `worker.ts:6-7` — `sendEmail()` runs, then `job.ack()`; no dedup record (sent-flag, job-ID log) is written anywhere | Crash/disconnect after send but before ack → redelivery on an at-least-once queue → duplicate email | Unprotected — no dedup record found in `worker.ts` (the only file in scope) | Kill the process immediately after `sendEmail` resolves, before `ack()`; redeliver and observe if the email sends twice | Write a durable "sent" record keyed by job ID before or atomically with the send, checked on entry; or move `ack()` before the side effect if at-most-once is acceptable | Medium — the missing dedup record is directly observed (High), but the redelivery consequence assumes at-least-once delivery, which isn't confirmed in this file |
| P2 | Calling the email provider twice for the same job does not produce two delivered emails | `worker.ts:6` — `sendEmail(job.data.email)` passes only the recipient, no job ID or client dedup token | Even if the provider supports idempotency tokens, none is used, so provider-side dedup isn't leveraged as a second line of defense | Unprotected — no dedup token or job ID passed to the provider in the reviewed code | Call `sendEmail` twice with identical job data; confirm two separate provider sends | Pass a stable idempotency key (e.g. job ID) to the email provider if it supports one | High |

## Existing safeguards

- None found in the reviewed scope (`worker.ts` only; queue configuration and email provider settings not inspected).

## Required verification before release

- [ ] Confirm the queue's actual delivery guarantee (at-least-once, at-most-once, exactly-once).
- [ ] Add a durable sent-record check before the side effect, or reorder ack-before-send if duplicates are unacceptable but delayed/lost sends are tolerable.
- [ ] Check whether the email provider supports an idempotency/dedup token and use it.

## Unknowns and boundaries

- The queue technology and its configured delivery semantics are not visible in this file — this determines whether redelivery is a routine occurrence or an edge case, but doesn't change that no dedup exists either way.
- Email provider retry/dedup behavior on its own side is unknown.
