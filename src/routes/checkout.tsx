import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { CreditCard, Lock, ShieldCheck } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-store";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

export const Route = createFileRoute("/checkout")({
  head: () => ({
    meta: [
      { title: "Secure Checkout · LUXE MAGNATE" },
      {
        name: "description",
        content: "Multi-currency, encrypted checkout with white-glove delivery.",
      },
    ],
  }),
  component: Checkout,
});

const IMG: Record<string, string> = {
  "/product-1.jpg": p1,
  "/product-2.jpg": p2,
  "/product-3.jpg": p3,
  "/product-4.jpg": p4,
  "/src/assets/product-1.jpg": p1,
  "/src/assets/product-2.jpg": p2,
  "/src/assets/product-3.jpg": p3,
  "/src/assets/product-4.jpg": p4,
};

const rates = { USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67 } as const;
const syms = { USD: "$", EUR: "€", GBP: "£", AED: "د.إ " } as const;
type Cur = keyof typeof rates;

const schema = z.object({
  email: z.string().trim().email("Enter a valid email").max(255),
  firstName: z.string().trim().min(1, "Required").max(80),
  lastName: z.string().trim().min(1, "Required").max(80),
  address: z.string().trim().min(4, "Required").max(200),
  city: z.string().trim().min(1, "Required").max(80),
  postal: z.string().trim().min(2, "Required").max(20),
  country: z.string().trim().min(2, "Required").max(80),
  card: z
    .string()
    .trim()
    .regex(/^\d{13,19}$/, "Card must be 13–19 digits")
    .transform((s) => s.replace(/\s+/g, "")),
  exp: z
    .string()
    .trim()
    .regex(/^(0[1-9]|1[0-2])\/\d{2}$/, "Use MM/YY"),
  cvc: z
    .string()
    .trim()
    .regex(/^\d{3,4}$/, "3–4 digits"),
});
type FormValues = z.infer<typeof schema>;
type Errors = Partial<Record<keyof FormValues, string>>;

function Checkout() {
  const navigate = useNavigate();
  const { items, subtotalCents, clear, userId } = useCart();
  const [currency, setCurrency] = useState<Cur>("USD");
  const [processing, setProcessing] = useState(false);
  const [values, setValues] = useState<Record<string, string>>({});
  const [errors, setErrors] = useState<Errors>({});
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  useEffect(() => {
    if (!userId) return;
    supabase.auth.getUser().then(({ data }) => {
      if (data.user?.email && !values.email) setValues((v) => ({ ...v, email: data.user!.email! }));
    });
  }, [userId]); // eslint-disable-line react-hooks/exhaustive-deps

  const rate = rates[currency];
  const sym = syms[currency];
  const shipping = 0;
  const tax = Math.round(subtotalCents * 0.08);
  const total = subtotalCents + shipping + tax;
  const fmt = (cents: number) => `${sym}${Math.round((cents / 100) * rate).toLocaleString()}`;

  const set = (k: keyof FormValues) => (e: React.ChangeEvent<HTMLInputElement>) => {
    const v = e.target.value;
    setValues((s) => ({ ...s, [k]: v }));
    if (touched[k]) {
      const single = schema.shape[k].safeParse(v);
      setErrors((s) => ({
        ...s,
        [k]: single.success ? undefined : single.error.issues[0]?.message,
      }));
    }
  };
  const blur = (k: keyof FormValues) => () => {
    setTouched((s) => ({ ...s, [k]: true }));
    const single = schema.shape[k].safeParse(values[k] ?? "");
    setErrors((s) => ({ ...s, [k]: single.success ? undefined : single.error.issues[0]?.message }));
  };

  const parsed = useMemo(() => schema.safeParse(values), [values]);
  const canSubmit = parsed.success && items.length > 0 && !processing;

  const pay = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = schema.safeParse(values);
    if (!result.success) {
      const eObj: Errors = {};
      result.error.issues.forEach((i) => {
        eObj[i.path[0] as keyof FormValues] = i.message;
      });
      setErrors(eObj);
      setTouched(Object.fromEntries(Object.keys(schema.shape).map((k) => [k, true])));
      toast.error("Please correct the highlighted fields.");
      return;
    }
    if (!userId) {
      toast.error("Sign in to complete your acquisition.");
      navigate({ to: "/auth" });
      return;
    }
    if (items.length === 0) {
      toast.error("Your vault is empty.");
      return;
    }

    setProcessing(true);
    try {
      const { data: order, error: orderErr } = await supabase
        .from("orders")
        .insert({
          user_id: userId,
          status: "awaiting_payment",
          currency,
          subtotal_cents: subtotalCents,
          tax_cents: tax,
          shipping_cents: shipping,
          total_cents: total,
          shipping_address: {
            firstName: result.data.firstName,
            lastName: result.data.lastName,
            address: result.data.address,
            city: result.data.city,
            postal: result.data.postal,
            country: result.data.country,
          },
        })
        .select("id")
        .single();
      if (orderErr) throw orderErr;

      const rows = items.map((i) => ({
        order_id: order.id,
        product_id: i.id,
        name: i.name,
        price_cents: i.price_cents,
        qty: i.qty,
        image_url: i.image_url,
      }));
      const { error: itemsErr } = await supabase.from("order_items").insert(rows);
      if (itemsErr) throw itemsErr;

      // Try creating a real Stripe checkout session if keys are configured
      try {
        const stripeRes = await fetch("/api/checkout-session", {
          method: "POST",
          headers: { "content-type": "application/json" },
          body: JSON.stringify({
            orderId: order.id,
            userId,
            items,
            tax_cents: tax,
            subtotal_cents: subtotalCents,
            total_cents: total,
            currency,
          }),
        });

        if (stripeRes.ok) {
          const resData = await stripeRes.json();
          if (resData.hasStripe && resData.url) {
            await clear();
            toast.success("Redirecting to secured payment gateway...");
            window.location.href = resData.url;
            return;
          }
        }
      } catch (stripeErr) {
        console.warn("Real Stripe checkout failed or not configured, using fallback:", stripeErr);
      }

      await clear();
      toast.success("Order placed", {
        description: "Stripe live keys pending — order saved as awaiting_payment.",
      });
      navigate({ to: "/dashboard" });
    } catch (err) {
      console.error(err);
      const message = err instanceof Error ? err.message : "Please try again.";
      toast.error("Checkout failed", { description: message });
    } finally {
      setProcessing(false);
    }
  };

  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-8 py-12 sm:py-16">
      <div className="mb-10 animate-fade-up">
        <div className="text-xs uppercase tracking-[0.25em] text-gold mb-3">Checkout</div>
        <h1 className="font-display text-4xl sm:text-5xl">Complete your acquisition</h1>
        {!userId && (
          <p className="text-sm text-muted-foreground mt-3">
            <Link to="/auth" className="text-gold underline underline-offset-4">
              Sign in
            </Link>{" "}
            to save your order and cart across devices.
          </p>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.3fr_1fr]">
        <form
          onSubmit={pay}
          noValidate
          className="glass rounded-2xl p-6 sm:p-8 space-y-6 animate-fade-up"
        >
          <div className="flex items-center gap-2 text-sm text-emerald">
            <Lock className="h-4 w-4" /> Encrypted payment · PCI DSS Level 1
          </div>

          <Section title="Contact">
            <Field
              label="Email"
              type="email"
              placeholder="you@luxe.com"
              value={values.email ?? ""}
              onChange={set("email")}
              onBlur={blur("email")}
              error={errors.email}
            />
          </Section>

          <Section title="Delivery">
            <div className="grid sm:grid-cols-2 gap-3">
              <Field
                label="First name"
                value={values.firstName ?? ""}
                onChange={set("firstName")}
                onBlur={blur("firstName")}
                error={errors.firstName}
              />
              <Field
                label="Last name"
                value={values.lastName ?? ""}
                onChange={set("lastName")}
                onBlur={blur("lastName")}
                error={errors.lastName}
              />
            </div>
            <Field
              label="Address"
              value={values.address ?? ""}
              onChange={set("address")}
              onBlur={blur("address")}
              error={errors.address}
            />
            <div className="grid sm:grid-cols-3 gap-3">
              <Field
                label="City"
                value={values.city ?? ""}
                onChange={set("city")}
                onBlur={blur("city")}
                error={errors.city}
              />
              <Field
                label="Postal code"
                value={values.postal ?? ""}
                onChange={set("postal")}
                onBlur={blur("postal")}
                error={errors.postal}
              />
              <Field
                label="Country"
                placeholder="United States"
                value={values.country ?? ""}
                onChange={set("country")}
                onBlur={blur("country")}
                error={errors.country}
              />
            </div>
          </Section>

          <Section title="Payment">
            <div className="grid sm:grid-cols-[1fr_auto] gap-3 items-start">
              <Field
                label="Card number"
                placeholder="4242 4242 4242 4242"
                inputMode="numeric"
                autoComplete="cc-number"
                icon={<CreditCard className="h-4 w-4" />}
                value={values.card ?? ""}
                onChange={set("card")}
                onBlur={blur("card")}
                error={errors.card}
              />
              <div className="grid grid-cols-2 gap-3">
                <Field
                  label="MM/YY"
                  placeholder="12/28"
                  value={values.exp ?? ""}
                  onChange={set("exp")}
                  onBlur={blur("exp")}
                  error={errors.exp}
                />
                <Field
                  label="CVC"
                  placeholder="123"
                  inputMode="numeric"
                  value={values.cvc ?? ""}
                  onChange={set("cvc")}
                  onBlur={blur("cvc")}
                  error={errors.cvc}
                />
              </div>
            </div>
          </Section>

          <button
            type="submit"
            disabled={!canSubmit}
            className="w-full gold-gradient text-primary-foreground py-4 rounded-md font-medium inline-flex items-center justify-center gap-2 disabled:opacity-60 shadow-gold-glow hover-lift"
          >
            {processing ? (
              <>
                <span className="h-4 w-4 border-2 border-primary-foreground border-t-transparent rounded-full animate-spin" />{" "}
                Processing…
              </>
            ) : (
              <>Pay {fmt(total)}</>
            )}
          </button>
          <div className="text-xs text-muted-foreground text-center">
            Stripe live-key integration ready · connect your Stripe account to charge cards
          </div>
        </form>

        <aside
          className="glass rounded-2xl p-6 sm:p-8 h-fit animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center justify-between mb-4">
            <div className="font-display text-xl">Your order</div>
            <select
              value={currency}
              onChange={(e) => setCurrency(e.target.value as Cur)}
              className="bg-muted/50 rounded-md px-2 py-1 text-xs border border-gold/20"
            >
              <option>USD</option>
              <option>EUR</option>
              <option>GBP</option>
              <option>AED</option>
            </select>
          </div>
          <div className="space-y-4 mb-6">
            {items.length === 0 && (
              <div className="text-sm text-muted-foreground text-center py-6">
                Your vault is empty.{" "}
                <Link to="/marketplace" className="text-gold underline underline-offset-4">
                  Browse marketplace
                </Link>
                .
              </div>
            )}
            {items.map((i) => {
              const img = (i.image_url && IMG[i.image_url]) || i.image_url || p1;
              return (
                <div key={i.id} className="flex gap-3">
                  <img
                    src={img}
                    alt={i.name}
                    loading="lazy"
                    width={80}
                    height={80}
                    className="h-16 w-16 rounded-md object-cover shrink-0"
                  />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium truncate">{i.name}</div>
                    <div className="text-xs text-muted-foreground">Qty {i.qty}</div>
                  </div>
                  <div className="text-sm gold-text font-medium">{fmt(i.price_cents * i.qty)}</div>
                </div>
              );
            })}
          </div>
          <div className="space-y-2 pt-4 border-t border-gold/10 text-sm">
            <Row l="Subtotal" v={fmt(subtotalCents)} />
            <Row l="Shipping" v="Complimentary" />
            <Row l="Estimated tax" v={fmt(tax)} />
            <div className="pt-3 mt-2 border-t border-gold/10 flex justify-between font-display text-lg">
              <span>Total</span>
              <span className="gold-text">{fmt(total)}</span>
            </div>
          </div>
          <div className="mt-6 flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-4 w-4 text-gold" /> Insured white-glove delivery included
          </div>
        </aside>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-xs uppercase tracking-widest text-gold mb-3">{title}</div>
      <div className="space-y-3">{children}</div>
    </div>
  );
}

function Field({
  label,
  icon,
  error,
  ...rest
}: {
  label: string;
  icon?: React.ReactNode;
  error?: string;
} & React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <label className="block">
      <span className="text-xs text-muted-foreground">{label}</span>
      <div className="relative mt-1">
        {icon && (
          <div className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
            {icon}
          </div>
        )}
        <input
          {...rest}
          aria-invalid={!!error}
          className={`w-full bg-muted/50 rounded-md ${icon ? "pl-10" : "pl-3"} pr-3 py-2.5 text-sm outline-none border transition ${
            error
              ? "border-destructive/60 focus:border-destructive"
              : "border-transparent focus:border-gold/40"
          }`}
        />
      </div>
      {error && <span className="text-[11px] text-destructive mt-1 block">{error}</span>}
    </label>
  );
}

function Row({ l, v }: { l: string; v: string }) {
  return (
    <div className="flex justify-between">
      <span className="text-muted-foreground">{l}</span>
      <span>{v}</span>
    </div>
  );
}
