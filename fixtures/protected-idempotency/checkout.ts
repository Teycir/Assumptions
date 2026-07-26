// Fixture: protected-idempotency
// A payment endpoint with full idempotency protection (Stripe idempotencyKey + DB UNIQUE constraint).

import { stripe } from "./stripe-client";
import { db } from "./db";

app.post("/checkout", async (req, res) => {
  const idempotencyKey = req.headers["x-idempotency-key"] as string;
  if (!idempotencyKey) {
    return res.status(400).json({ error: "Missing idempotency key" });
  }

  const payment = await stripe.charges.create(
    {
      amount: req.body.amount,
      customer: req.user.stripeCustomerId,
    },
    { idempotencyKey }
  );

  await db.transaction(async (tx) => {
    await tx.orders.create({
      userId: req.user.id,
      paymentId: payment.id,
      idempotencyKey,
    });
  });

  res.json(payment);
});
