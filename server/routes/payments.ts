import { RequestHandler } from "express";
import { db } from "../db";

// Stripe is optional until keys are provided
let stripe: any = null;
function getStripe() {
  if (stripe) return stripe;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  // Lazy import to avoid requiring dependency without key
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  const Stripe = require("stripe");
  stripe = new Stripe(key, { apiVersion: "2024-10-28.acacia" });
  return stripe;
}

export const createPaymentIntent: RequestHandler = async (req, res) => {
  const { amount, currency, userId } = req.body as { amount: number; currency?: string; userId?: string };
  if (!amount || amount <= 0) return res.status(400).json({ error: "Invalid amount" });
  const curr = (currency || "usd").toLowerCase();

  const s = getStripe();
  if (!s) {
    return res.status(400).json({ error: "Stripe keys not configured. Set STRIPE_SECRET_KEY and VITE_STRIPE_PUBLISHABLE_KEY." });
  }

  try {
    const intent = await s.paymentIntents.create({ amount, currency: curr, automatic_payment_methods: { enabled: true } });
    db.addPayment({ userId: userId ?? null, amount, currency: curr, stripePaymentIntentId: intent.id, status: intent.status });
    return res.json({ clientSecret: intent.client_secret, paymentIntentId: intent.id });
  } catch (e: any) {
    return res.status(500).json({ error: e.message || "Failed to create payment intent" });
  }
};
