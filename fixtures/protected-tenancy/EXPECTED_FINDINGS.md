# Expected findings: protected-tenancy

This fixture tests whether the skill correctly identifies an explicit tenant isolation filter in database queries and refrains from falsely claiming an authorization leak.

## Protected Safeguards

### Protected — Cross-tenant invoice access is prevented by query tenant predicate

- **Assumption:** Access to invoice records is restricted strictly to the calling user's tenant.
- **Evidence:** `db.invoices.findFirst` contains an explicit `tenantId: req.user.tenantId` clause in the `where` query object.
- **If false:** A user from Tenant A could view invoices belonging to Tenant B by guessing invoice IDs.
- **Status:** Protected
- **Evidence confidence:** High
- **Falsification test:** Authenticate as a user from Tenant A, request an invoice ID owned by Tenant B; verify response is 404.

## Non-findings / Prohibited Claims

- **Do NOT flag P0 tenant leakage / IDOR:** Query filters by `tenantId`.
