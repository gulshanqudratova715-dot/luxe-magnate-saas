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

export const Route = createFileRoute("/api/checkout-session")({
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

          const { orderId, userId, items, tax_cents, subtotal_cents, total_cents, currency } =
            await request.json();

          const origin = request.headers.get("origin") || "http://localhost:3000";

          // Build line items matching the cart contents
          const line_items = items.map((it: any) => ({
            price_data: {
              currency: (currency || "usd").toLowerCase(),
              product_data: {
                name: it.name,
                images: it.image_url
                  ? [it.image_url.startsWith("http") ? it.image_url : `${origin}${it.image_url}`]
                  : [],
              },
              unit_amount: it.price_cents,
            },
            quantity: it.qty,
          }));

          // Add tax line item if applicable
          if (tax_cents > 0) {
            line_items.push({
              price_data: {
                currency: (currency || "usd").toLowerCase(),
                product_data: {
                  name: "Estimated Tax (8%)",
                },
                unit_amount: tax_cents,
              },
              quantity: 1,
            });
          }

          const session = await stripe.checkout.sessions.create({
            payment_method_types: ["card"],
            line_items,
            mode: "payment",
            metadata: {
              orderId,
              userId,
            },
            success_url: `${origin}/dashboard?checkout_success=true&order_id=${orderId}&session_id={CHECKOUT_SESSION_ID}`,
            cancel_url: `${origin}/checkout?checkout_cancel=true`,
          });

          return new Response(JSON.stringify({ hasStripe: true, url: session.url }), {
            headers: { "content-type": "application/json" },
          });
        } catch (err: any) {
          console.error("Stripe Checkout Session Error:", err);
          return new Response(
            JSON.stringify({ error: err.message || "Failed to create checkout session" }),
            { status: 500, headers: { "content-type": "application/json" } },
          );
        }
      },
    },
  },
});
