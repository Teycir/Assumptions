# Expected findings: false-positive-middleware

This fixture tests whether the skill inspects attached route middleware before declaring input handling unvalidated.

## Protected Safeguards

### Protected — Body validation is handled by validateBody middleware

- **Assumption:** Input data attached to `req.body` matches expected types and non-null constraints before handler execution.
- **Evidence:** `app.patch` includes `validateBody(userUpdateSchema)` as route middleware prior to the handler function.
- **If false:** Unvalidated payload properties could cause unexpected runtime type errors.
- **Status:** Protected
- **Evidence confidence:** High
- **Falsification test:** Send an invalid JSON payload (e.g. `{ email: 123 }`); verify middleware rejects request with 400 validation error before handler is executed.

## Non-findings / Prohibited Claims

- **Do NOT flag unvalidated user input:** The middleware validation is explicitly present on the route pipeline.
