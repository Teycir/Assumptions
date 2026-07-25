import { stripe } from "../stripe";
import { db } from "../db";

// Refund a customer's most recent order.
export async function refundOrder(req, res) {
  const order = await db.orders.findById(req.body.orderId);
  if (!order) {
    return res.status(404).json({ error: "order not found" });
  }

  // Fix: verify the caller owns this order before refunding it.
  if (order.userId !== req.user.id) {
    return res.status(403).json({ error: "forbidden" });
  }

  const refund = await stripe.refunds.create({
    charge: order.chargeId,
    amount: order.amount,
  });

  await db.orders.update(order.id, { status: "refunded" });

  return res.json({ refund });
}
