# Example: Cache authorization roles on login

## Input diff (summary)

```ts
// src/auth/roles.ts
async function getUserRoles(userId: string) {
  const cached = await redis.get(`roles:${userId}`);
  if (cached) return JSON.parse(cached);

  const roles = await db.role.findMany({ where: { userId } });
  await redis.set(`roles:${userId}`, JSON.stringify(roles), "EX", 3600);  // line 7
  return roles;
}
```

No cache invalidation call is added anywhere a user's roles are changed
(e.g. an admin revoking access).

## Output ledger

```
# Assumptions: Cache authorization roles on login

**Scope:** src/auth/roles.ts
**Overall risk:** Medium
**Release blockers:** 0

## Executive summary

Roles are cached for up to one hour with no invalidation path when roles
change. The main risk is a revoked permission remaining effective for up
to the TTL window, which is primarily a security/authorization concern
rather than a correctness one.

## Ledger

| Priority | Assumption | Evidence | If false | Status | Falsification test | Recommended action | Evidence confidence |
|---|---|---|---|---|---|---|---|
| P1 | A revoked or changed role takes effect for a user within an acceptable window, not just at cache expiry. | `src/auth/roles.ts:7` — `redis.set(..., "EX", 3600)` sets a 1-hour TTL; no `redis.del` call was found anywhere roles are modified in the reviewed scope. | An admin revokes a user's access, but the user retains the old, cached permissions for up to an hour. | Partially protected — the TTL bounds the exposure window to at most one hour, but no active invalidation exists at role-mutation sites. | Grant a role, cache it, then revoke it directly in the database and confirm the cached response still reflects the old role before TTL expiry. | Invalidate (`DEL`) the cache key at every point roles are created, updated, or removed. | High |

## Existing safeguards

- A 1-hour TTL at `src/auth/roles.ts:7` bounds the maximum staleness window.

## Required verification before release

- [ ] Decide whether a 1-hour stale-permission window is acceptable for the
      product's security requirements.
- [ ] If not, add explicit cache invalidation at every role-mutation site.

## Unknowns and boundaries

- Whether any role-mutation code path exists outside the reviewed scope
  was not confirmed.
```
