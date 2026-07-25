# Expected findings: queue-redelivery

## P0 — Side effect happens before acknowledgement, with no dedup record

- **Evidence:** `await sendEmail(job.data.email)` runs, then `job.ack()`
  is called afterward; no durable record (e.g. a "sent" flag keyed by job
  ID) is written before or after the send.
- **If false:** If the worker process dies or the connection drops after
  `sendEmail` succeeds but before `job.ack()` completes, an at-least-once
  queue will redeliver the message, and `sendEmail` runs again — sending a
  duplicate email.
- **Falsification test:** Kill the worker process (or simulate a crash)
  immediately after `sendEmail` resolves but before `ack()` is called;
  redeliver the message and observe whether the email is sent twice.
- **Confidence:** Verified (assuming the queue is at-least-once delivery,
  which is the common default for most queue systems — should be labeled
  `Likely` unless the specific queue's delivery semantics are confirmed
  in the surrounding repository)

## P2 — No idempotency key for the email send itself

- **Evidence:** `sendEmail(job.data.email)` takes only the recipient
  address, with no job ID or dedup token passed to the email provider.
- **If false:** Even if some providers support dedup based on a client
  token, this code does not use that mechanism, so provider-side
  deduplication (if available) is not being leveraged.
- **Falsification test:** Call `sendEmail` twice with the same job data
  and confirm two separate emails are sent by the provider.
- **Confidence:** Verified

## Non-findings

- The exact delivery guarantee of the underlying queue technology (SQS,
  RabbitMQ, BullMQ, etc.) is not shown in this fixture and should be
  labeled `Unknown` unless confirmed elsewhere in the repository.
