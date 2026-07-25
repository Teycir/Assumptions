# Example: Handle subscription webhook events

## Input diff (summary)

```ts
app.post("/webhooks/subscription", async (req, res) => {
  const event = req.body;

  await db.subscription.update({
    where: { id: event.subscriptionId },
    data: { status: event.status },
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

| Priority | Assumption | Evidence | If false | Current protection | Falsification test | Recommended action | Confidence |
|---|---|---|---|---|---|---|---|
| P1 | Webhook events for a given subscription always arrive in the order they were generated. | The handler applies `event.status` directly with no comparison against a stored event timestamp or version. | A delayed or redelivered older event can overwrite a newer subscription status, reverting state incorrectly. | None found. | Send two events out of order (newer first, older second) and confirm the final stored status matches the newer event. | Store and compare an event timestamp or monotonic version before applying the update; ignore older events. | Likely |
| P2 | The webhook provider will not redeliver the same event more than once in a way that matters. | No idempotency key or event-ID deduplication is present in the handler. | A redelivered duplicate event re-applies the same status; likely harmless here since the write is idempotent by value, but worth confirming. | The update itself is idempotent for identical repeated events. | Send the identical event twice and confirm no unintended side effects (e.g. duplicate notifications) occur elsewhere in the flow. | Track processed event IDs if any non-idempotent side effect (email, billing action) is later added to this handler. | Assumption to verify |

## Existing safeguards

- The core update operation is naturally idempotent for identical repeated
  events (same status written twice has no additional effect).

## Required verification before release

- [ ] Confirm the webhook provider's ordering and redelivery guarantees.
- [ ] Add an event timestamp/version check before applying updates.

## Unknowns and boundaries

- The specific webhook provider's delivery-order guarantee was not
  documented in this repository.
```
