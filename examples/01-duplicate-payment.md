# Example: Add "retry refund" endpoint

## Input diff (summary)

```ts
// src/refunds/retry.ts
app.post("/refunds/:id/retry", async (req, res) => {          // line 3
  const refund = await stripe.refunds.create({                // line 4
    charge: req.body.chargeId,                                // line 5
    amount: req.body.amount,                                  // line 6
  });                                                          // line 7

  return res.json({ status: "ok", refundId: refund.id });
});
```

No idempotency key is sent to Stripe. No local record is written before or
after the call. The only existing test covers a single successful
invocation with no retry or timeout scenario.

## Output ledger

```
# Assumptions: Add "retry refund" endpoint

**Scope:** src/refunds/retry.ts (new file)
**Overall risk:** High
**Release blockers:** 1

## Executive summary

This endpoint issues a provider-side refund with no idempotency protection
and no durable record of the request prior to calling the provider. A
client retry after a timeout can produce a second refund. No evidence of
an idempotency key, unique constraint, or pre-call persistence was found
in `src/refunds/retry.ts` or the reviewed test file.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | Duplicate refund requests are prevented or safely deduplicated. | `src/refunds/retry.ts:4-7` — `stripe.refunds.create()` is called with no `idempotencyKey` option and no database write before the call. | A retry (client-side or network-level) issues a second refund for the same charge. | Unprotected — none found in `src/refunds/retry.ts` or `tests/refunds/retry.test.ts`; the API gateway/load balancer's retry behavior was not inspected. | Simulate a timeout after the provider accepts the request, then retry the same call. | Persist a request key before calling the provider, and pass it as Stripe's idempotency key. | High |
| P1 | A caller can reliably determine the refund's outcome after a response interruption. | `src/refunds/retry.ts:9` — the endpoint returns a single synchronous response with no reconciliation path found elsewhere in the reviewed scope. | A dropped response after a successful provider call leaves the client unsure whether to retry. | Unprotected — none found in `src/refunds/retry.ts`; no background reconciliation job was present in the reviewed scope. | Kill the response after the provider call succeeds; check refund state afterward. | Add a durable refund-request record the client or a background job can poll. | Medium |

## Existing safeguards

- None found in `src/refunds/retry.ts` or `tests/refunds/retry.test.ts`.

## Required verification before release

- [ ] Add an idempotency key derived from a durable request record.
- [ ] Add a test that retries an identical request and asserts one refund.

## Unknowns and boundaries

- Whether the API gateway or load balancer retries POST requests
  automatically was not determinable from this repository.
```
