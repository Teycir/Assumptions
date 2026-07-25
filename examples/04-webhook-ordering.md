# Example: Handle subscription webhook events

## Input diff (summary)

```ts
// src/webhooks/subscription.ts
app.post("/webhooks/subscription", async (req, res) => {  // line 2
  const event = req.body;

  await db.subscription.update({                          // line 6
    where: { id: event.subscriptionId },
    data: { status: event.status },                        // line 8
  });

  res.sendStatus(200);
});
```

The handler applies whatever status arrives, with no event timestamp or
sequence check. No test simulates out-of-order delivery.

## Output ledger

```
# Assumptions: Handle subscription webhook events

**Scope:** src/webhooks/subscription.ts
**Overall risk:** Medium
**Release blockers:** 0

## Executive summary

The webhook handler writes the incoming event's status unconditionally,
with no check against event ordering or timestamps. Most webhook
providers do not guarantee in-order delivery, so a stale event arriving
after a newer one could overwrite current state with outdated data.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P1 | Webhook events for a given subscription are applied in the order they were generated, regardless of delivery order. | `src/webhooks/subscription.ts:6-8` — the handler applies `event.status` directly with no comparison against a stored event timestamp or version. | A delayed or redelivered older event can overwrite a newer subscription status, reverting state incorrectly. | Unprotected — no timestamp or version check found in `src/webhooks/subscription.ts`. | Send two events out of order (newer first, older second) and confirm the final stored status matches the newer event. | Store and compare an event timestamp or monotonic version before applying the update; ignore older events. | High |
| P2 | A redelivered duplicate event does not cause an unintended side effect. | `src/webhooks/subscription.ts:6-8` — no idempotency key or event-ID deduplication is present; the update writes `event.status` directly, which is idempotent for identical repeated values. | If a non-idempotent side effect (email, billing action) is added to this handler later without dedup, a redelivered event would trigger it twice. | Partially protected — the current write is idempotent by value, but no event-ID deduplication exists, so this only holds as long as no non-idempotent effect is added. | Send the identical event twice and confirm no unintended side effects (e.g. duplicate notifications) occur elsewhere in the flow. | Track processed event IDs now, before any non-idempotent side effect is added to this handler. | Medium |

## Existing safeguards

- The core update operation is naturally idempotent for identical repeated
  events (same status written twice has no additional effect), based on
  `src/webhooks/subscription.ts:6-8`.

## Required verification before release

- [ ] Confirm the webhook provider's ordering and redelivery guarantees.
- [ ] Add an event timestamp/version check before applying updates.

## Unknowns and boundaries

- The specific webhook provider's delivery-order guarantee was not
  documented in this repository.
```
