import { requireAdmin } from "../../middleware/require-admin";

// New endpoint: permanently deletes an organization. Admin-only.
export async function deleteOrg(req, res) {
  await requireAdmin(req, res, async () => {
    await db.orgs.delete(req.params.orgId);
    return res.json({ deleted: true });
  });
}
