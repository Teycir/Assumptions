# fixtures/org-roles-rollout — diff manifest

This fixture is a single **diff summary** (this file) representing 17
changed files, rather than 17 real source files — the point of this
fixture is to test the skill's oversized-scope triage logic (which
files it selects to actually read vs. excludes), not to give it 17
files worth reading in full. Per `CONTRIBUTING.md`'s fixture
conventions, the *selected* high-risk files below are backed by real
minimal pseudo-code in this directory; the *excluded* files are
represented only by this manifest, since a correct run should never
open them.

## Changed files (17 total)

### High-risk — should be selected for the review pass

1. `db/003_add_role_column.sql` — migration, adds `role` column
2. `src/middleware/require-admin.ts` — authorization check reading `role`
3. `src/routes/admin/delete-org.ts` — new authenticated admin endpoint using the middleware
4. `src/workers/role-sync-worker.ts` — background job reading `role`

### Should be excluded from the review pass (state why, don't open)

5. `src/ui/RoleBadge.tsx` — UI-only, renders a role label
6. `src/ui/AdminPanel.tsx` — UI-only, admin panel shell
7. `src/ui/UserRow.tsx` — UI-only, table row component
8. `src/ui/RoleSelect.tsx` — UI-only, dropdown component
9. `src/ui/styles/admin.css` — styling only
10. `src/ui/icons/shield.svg` — static asset
11. `src/generated/api-client.ts` — generated from OpenAPI spec, do not hand-review
12. `src/generated/types.ts` — generated types
13. `src/generated/admin-client.ts` — generated client stub
14. `src/generated/role.pb.ts` — generated protobuf bindings
15. `tests/ui/RoleBadge.test.tsx` — UI snapshot test, no logic
16. `docs/roles.md` — documentation update, prose only
17. `package.json` — version bump, unrelated dependency update
