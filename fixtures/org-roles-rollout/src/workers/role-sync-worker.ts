// Periodically syncs role-based permissions to the external SSO provider.
export async function syncRoles(users) {
  for (const user of users) {
    // Rows not yet backfilled have role = NULL. This silently skips
    // them rather than erroring — so freshly-migrated users are
    // invisible to the SSO sync until something else sets their role,
    // with no log line indicating anyone was skipped.
    if (!user.role) continue;

    await ssoProvider.setRole(user.id, user.role);
  }
}
