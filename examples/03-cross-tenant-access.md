# Example: Add "get invoice by id" endpoint

## Input diff (summary)

```ts
app.get("/invoices/:id", async (req, res) => {
  const invoice = await db.invoice.findUnique({
    where: { id: req.params.id },
  });

  res.json(invoice);
});
```

The route is registered under an authenticated router group, but the
query itself does not reference `req.user` or any tenant/organization
scope.

## Output ledger

```
# Assumption Ledger: Add "get invoice by id" endpoint

**Scope:** src/routes/invoices.ts
**Overall risk:** High
**Release blockers:** 0 (pending verification — see below)

## Executive summary

The route requires authentication but the database query fetches an
invoice by ID alone, with no tenant or ownership filter in the query
itself. Whether tenant isolation is enforced elsewhere (middleware,
row-level security) could not be confirmed from the reviewed scope. This
is flagged P0-severity but Likely-confidence: if verification shows no
scoping exists elsewhere, it becomes a confirmed release blocker.

## Ledger

| Priority | Assumption | Evidence | If false | Current protection | Falsification test | Recommended action | Confidence |
|---|---|---|---|---|---|---|---|
| P0 | The authenticated caller can only ever receive invoices belonging to their own tenant. | `findUnique({ where: { id } })` filters only by primary key; no `organizationId`/`tenantId` clause is present in this query. | An authenticated user from tenant A can read tenant B's invoice by guessing or enumerating IDs. | Route requires authentication, but authentication is not the same as authorization/tenant scoping. | Authenticate as tenant A, request an invoice ID known to belong to tenant B, and confirm the response is empty or forbidden. | Add an explicit tenant filter to the query, or confirm and document row-level security enforcing it at the database layer. | Likely |

## Existing safeguards

- The route is registered behind authentication middleware (confirms
  identity, not tenant scope).

## Required verification before release

- [ ] Confirm whether tenant scoping is enforced by database-level policy
      (e.g. Postgres RLS) outside this file.
- [ ] If not, add an explicit tenant/organization filter to the query.
- [ ] Add a cross-tenant access test as a regression guard.

## Unknowns and boundaries

- Whether row-level security or a query middleware enforces tenant scoping
  elsewhere in the stack was not determinable from the reviewed scope.
```
