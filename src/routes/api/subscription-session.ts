/* eslint-disable @typescript-eslint/no-explicit-any */
import { createFileRoute } from "@tanstack/react-router";
import Stripe from "stripe";

let stripeClient: Stripe | null = null;

function getStripe(): Stripe | null {
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) return null;
  if (!stripeClient) {
    stripeClient = new Stripe(key, {
      apiVersion: "2023-10-16" as any,
    });
  }
  return stripeClient;
}

export const Route = createFileRoute("/api/subscription-session")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        try {
          const stripe = getStripe();
          if (!stripe) {
            return new Response(
              JSON.stringify({
                hasStripe: false,
                message: "Stripe key not configured on backend.",
              }),
              { headers: { "content-type": "application/json" } },
            );
          }

          const { userId, planName, interval, priceUsd } = await request.json();

          const origin = request.headers.get("origin") || "http://localhost:3000";

          // Calculate recurring price based on plan and billing interval
          const amountCents = Math.round(priceUsd * 100);

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items: [
              {
                price_data: {
                  currency: "usd",
                  product_data: {
                    name: `LUXE MAGNATE - ${planName} Plan`,
                    description: `Private concierge subscription with priority booking and exclusive curated asset curation.`,
                  },
                  unit_amount: amountCents,
                  recurring: {
                    interval: interval === "annually" ? "year" : "month",
                  },
                },
                quantity: 1,
              },
            ],
            mode: "subscription",
            metadata: {
              userId,
              planName,
              interval,
            },
            success_url: `${origin}/dashboard?subscription_success=true&plan=${planName}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/dashboard?subscription_cancel=true`,
          });

          return new Response(JSON.stringify({ hasStripe: true, url: session.url }), {
            headers: { "content-type": "application/json" },
          });
        } catch (err: any) {
          console.error("Stripe Subscription Session Error:", err);
          return new Response(
            JSON.stringify({ error: err.message || "Failed to create subscription session" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
