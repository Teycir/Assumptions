# Example: Add "get invoice by id" endpoint

## Input diff (summary)

```ts
// src/routes/invoices.ts
app.get("/invoices/:id", async (req, res) => {   // line 4
  const invoice = await db.invoice.findUnique({  // line 5
    where: { id: req.params.id },                // line 6
  });

  res.json(invoice);
});
```

The route is registered under an authenticated router group, but the
query itself does not reference `req.user` or any tenant/organization
scope.

## Output ledger

```
# Assumptions: Add "get invoice by id" endpoint

**Scope:** src/routes/invoices.ts
**Overall risk:** High
**Release blockers:** 0 (pending verification — see below)

## Executive summary

The route requires authentication but the database query fetches an
invoice by ID alone, with no tenant or ownership filter in the query
itself. Whether tenant isolation is enforced elsewhere (middleware,
row-level security) could not be confirmed from the reviewed scope. This
is flagged P0-priority with an Unknown status: authentication confirms
identity, not tenant scoping, and this handler does not enforce tenant
scope directly, so whether the caller is actually protected depends on
layers outside the reviewed scope.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P0 | The authenticated caller can only ever receive invoices belonging to their own tenant. | `src/routes/invoices.ts:5-6` — `findUnique({ where: { id } })` filters only by primary key; no `organizationId`/`tenantId` clause is present in this query. | An authenticated user from tenant A can read tenant B's invoice by guessing or enumerating IDs. | Unknown — this handler does not enforce tenant scope directly; whether database row-level security, query middleware, or a service-layer authorization check protects this query elsewhere in the stack was not inspected. | Authenticate as tenant A, request an invoice ID known to belong to tenant B, and confirm the response is empty or forbidden. | Confirm and document a database/service-layer tenant guard, or add an explicit ownership predicate to the query. | High |

## Existing safeguards

- Authentication middleware confirms caller identity at the router level.
  It does not, by itself, demonstrate tenant-scoped authorization.

## Required verification before release

- [ ] Confirm whether tenant scoping is enforced by database-level policy
      (e.g. Postgres RLS) outside this file.
- [ ] If not, add an explicit tenant/organization filter to the query.
- [ ] Add a cross-tenant access test as a regression guard.

## Unknowns and boundaries

- Whether row-level security or a query middleware enforces tenant scoping
  elsewhere in the stack was not determinable from the reviewed scope.
```
