// Fixture: tenant-leak
// An authenticated route that queries by primary key only, with no
// explicit tenant/ownership scope in the query itself.

app.get("/invoices/:id", async (req, res) => {
  const invoice = await db.invoice.findUnique({
    where: { id: req.params.id },
  });

  res.json(invoice);
});
