// Fixture: protected-tenancy
// Invoice lookup endpoint with explicit tenant isolation predicate.

import { db } from "./db";

app.get("/invoices/:id", async (req, res) => {
  const invoice = await db.invoices.findFirst({
    where: {
      id: req.params.id,
      tenantId: req.user.tenantId,
    },
  });

  if (!invoice) {
    return res.status(404).json({ error: "Invoice not found" });
  }

  res.json(invoice);
});
