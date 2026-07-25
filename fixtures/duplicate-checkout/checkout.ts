// Fixture: duplicate-checkout
// A minimal checkout endpoint with no idempotency protection.

import { stripe } from "./stripe-client";
import { orders } from "./db";

app.post("/checkout", async (req, res) => {
  const payment = await stripe.charges.create({
    amount: req.body.amount,
    customer: req.user.stripeCustomerId,
  });

  await orders.create({
    userId: req.user.id,
    paymentId: payment.id,
  });

  res.json(payment);
});
