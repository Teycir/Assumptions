# Example: Add "retry refund" endpoint

## Input diff (summary)

```ts
app.post("/refunds/:id/retry", async (req, res) => {
  const refund = await stripe.refunds.create({
    charge: req.body.chargeId,
    amount: req.body.amount,
  });

  return res.json({ status: "ok", refundId: refund.id });
});
```

No idempotency key is sent to Stripe. No local record is written before or
after the call. The only existing test covers a single successful
invocation with no retry or timeout scenario.

## Output ledger

```
# Assumption Ledger: Add "retry refund" endpoint

**Scope:** src/refunds/retry.ts (new file)
**Overall risk:** High
**Release blockers:** 1

## Executive summary

This endpoint issues a provider-side refund with no idempotency protection
and no durable record of the request prior to calling the provider. A
client retry after a timeout can produce a second refund. No evidence of
an idempotency key, unique constraint, or pre-call persistence was found.

## Ledger

| Priority | Assumption | Evidence | If false | Current protection | Falsification test | Recommended action | Confidence |
|---|---|---|---|---|---|---|---|
| P0 | Refund processing is idempotent per request. | `stripe.refunds.create()` is called directly with no `idempotencyKey` option and no prior database write. | A retry (client-side or network-level) issues a second refund for the same charge. | None found. | Simulate a timeout after the provider accepts the request, then retry the same call. | Persist a request key before calling the provider, and pass it as Stripe's idempotency key. | Verified |
| P1 | The client can always tell whether the refund succeeded. | The endpoint returns a single synchronous response with no reconciliation path. | A dropped response after a successful provider call leaves the client unsure whether to retry. | None found. | Kill the response after the provider call succeeds; check refund state afterward. | Add a durable refund-request record the client or a background job can poll. | Likely |

## Existing safeguards

- None found in the reviewed scope.

## Required verification before release

- [ ] Add an idempotency key derived from a durable request record.
- [ ] Add a test that retries an identical request and asserts one refund.

## Unknowns and boundaries

- Whether the API gateway or load balancer retries POST requests
  automatically was not determinable from this repository.
```
