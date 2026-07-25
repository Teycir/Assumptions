import { db } from "../db";

// Handle incoming Stripe webhook events.
export async function handleStripeWebhook(event) {
  if (event.type === "charge.succeeded") {
    await db.orders.update(event.data.object.metadata.orderId, {
      status: "paid",
    });
  }

  if (event.type === "charge.refunded") {
    await db.orders.update(event.data.object.metadata.orderId, {
      status: "refunded",
    });
  }
}
