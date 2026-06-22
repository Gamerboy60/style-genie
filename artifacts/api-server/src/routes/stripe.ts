import { Router } from "express";
import { stripeStorage } from "../stripeStorage";
import { stripeService } from "../stripeService";

const router = Router();

// Get all plans (products with prices)
router.get("/stripe/plans", async (req, res) => {
  try {
    let rows: Record<string, unknown>[];
    try {
      rows = await stripeStorage.listProductsWithPrices() as Record<string, unknown>[];
    } catch {
      // Stripe not connected yet — return empty list; frontend uses hardcoded fallbacks
      res.json({ data: [] });
      return;
    }

    const productsMap = new Map<string, {
      id: string; name: string; description: string | null;
      metadata: Record<string, string>; prices: Array<{
        id: string; unit_amount: number | null; currency: string;
        recurring: Record<string, unknown> | null; metadata: Record<string, string>;
      }>;
    }>();

    for (const row of rows as Record<string, unknown>[]) {
      const pid = row.product_id as string;
      if (!productsMap.has(pid)) {
        productsMap.set(pid, {
          id: pid,
          name: row.product_name as string,
          description: row.product_description as string | null,
          metadata: (row.product_metadata as Record<string, string>) ?? {},
          prices: [],
        });
      }
      if (row.price_id) {
        productsMap.get(pid)!.prices.push({
          id: row.price_id as string,
          unit_amount: row.unit_amount as number | null,
          currency: row.currency as string,
          recurring: row.recurring as Record<string, unknown> | null,
          metadata: (row.price_metadata as Record<string, string>) ?? {},
        });
      }
    }

    res.json({ data: Array.from(productsMap.values()) });
  } catch (err) {
    req.log.error({ err }, "Failed to list plans");
    res.status(500).json({ error: "Failed to load plans" });
  }
});

// Create or get a guest user and start checkout
router.post("/stripe/checkout", async (req, res) => {
  try {
    const { priceId, email } = req.body as { priceId: string; email?: string };
    if (!priceId) {
      res.status(400).json({ error: "priceId is required" });
      return;
    }

    // Use a simple session-based user ID (or provided email as ID for guests)
    const userId = email ?? `guest_${Date.now()}`;
    let user = await stripeStorage.getUser(userId);
    if (!user) {
      user = await stripeStorage.upsertUser(userId, email);
    }

    let customerId = user.stripeCustomerId;
    if (!customerId) {
      const customer = await stripeService.createCustomer(email ?? "", userId);
      await stripeStorage.updateUserStripeInfo(userId, { stripeCustomerId: customer.id });
      customerId = customer.id;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;

    // Determine if this is a one-time or subscription price
    const plans = await stripeStorage.listProductsWithPrices();
    const priceRow = (plans as Record<string, unknown>[]).find(r => r.price_id === priceId);
    const isLifetime = (priceRow?.price_metadata as Record<string, string>)?.billing === "lifetime";

    const session = await stripeService.createCheckoutSession(
      customerId,
      priceId,
      `${baseUrl}/?checkout=success`,
      `${baseUrl}/pricing?checkout=cancelled`,
      isLifetime ? "payment" : "subscription"
    );

    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create checkout session");
    res.status(500).json({ error: "Failed to start checkout" });
  }
});

// Customer portal (manage subscription)
router.post("/stripe/portal", async (req, res) => {
  try {
    const { customerId } = req.body as { customerId: string };
    if (!customerId) {
      res.status(400).json({ error: "customerId is required" });
      return;
    }

    const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(",")[0]}`;
    const session = await stripeService.createCustomerPortalSession(customerId, `${baseUrl}/`);
    res.json({ url: session.url });
  } catch (err) {
    req.log.error({ err }, "Failed to create portal session");
    res.status(500).json({ error: "Failed to open billing portal" });
  }
});

export default router;
