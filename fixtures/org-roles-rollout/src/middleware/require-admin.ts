// Blocks non-admin requests from reaching a protected route.
export function requireAdmin(req, res, next) {
  // Existing users migrated before the backfill have role = NULL.
  // NULL !== 'admin' is true in JS, so this correctly denies them —
  // but it also silently denies real admins whose role hasn't been
  // backfilled yet, with no distinct error for "role unset" vs
  // "not an admin".
  if (req.user.role !== "admin") {
    return res.status(403).json({ error: "forbidden" });
  }
  next();
}
