import { createFileRoute } from "@tanstack/react-router";
import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, ShoppingBag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useCart } from "@/lib/cart-store";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";

export const Route = createFileRoute("/marketplace")({
  head: () => ({
    meta: [
      { title: "Marketplace · LUXE MAGNATE" },
      { name: "description", content: "Curated luxury goods and AI automation packages." },
    ],
  }),
  component: Marketplace,
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

type Product = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  price_cents: number;
  currency: string;
  stock: number;
  featured: boolean;
  image_url: string | null;
};

const rates = { USD: 1, EUR: 0.92, GBP: 0.79, AED: 3.67 } as const;
const syms = { USD: "$", EUR: "€", GBP: "£", AED: "د.إ " } as const;
type Cur = keyof typeof rates;

function Marketplace() {
  const [cat, setCat] = useState("All");
  const [q, setQ] = useState("");
  const [currency, setCurrency] = useState<Cur>("USD");
  const { add, setOpen } = useCart();

  const { data, isLoading, error } = useQuery({
    queryKey: ["products"],
    queryFn: async (): Promise<Product[]> => {
      const { data, error } = await supabase
        .from("products")
        .select("id,name,description,category,price_cents,currency,stock,featured,image_url")
        .order("featured", { ascending: false })
        .order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as Product[];
    },
  });

  const cats = useMemo(() => {
    const set = new Set<string>();
    (data ?? []).forEach((p) => p.category && set.add(p.category));
    return ["All", ...Array.from(set)];
  }, [data]);

  const items = useMemo(
    () =>
      (data ?? []).filter(
        (p) =>
          (cat === "All" || p.category === cat) && p.name.toLowerCase().includes(q.toLowerCase()),
      ),
    [data, cat, q],
  );

  const rate = rates[currency];
  const sym = syms[currency];

  const addToCart = (p: Product) => {
    add({
      id: p.id,
      name: p.name,
      price_cents: p.price_cents,
      image_url: (p.image_url && IMG[p.image_url]) || p.image_url,
      category: p.category,
    });
    setOpen(true);
    toast.success(`${p.name} reserved in your vault.`);
  };

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12 sm:py-16">
      <div className="mb-10 animate-fade-up">
        <div className="text-xs uppercase tracking-[0.25em] text-gold mb-3">The Marketplace</div>
        <h1 className="font-display text-4xl sm:text-5xl">Curated inventory</h1>
        <p className="text-muted-foreground mt-3 max-w-2xl">
          Live selection from our vetted atelier — each piece authenticated, insured, and delivered
          white-glove.
        </p>
      </div>

      <div className="glass rounded-xl p-4 mb-8 grid gap-3 sm:grid-cols-[1fr_auto_auto] items-center">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search collection…"
            className="w-full bg-muted/50 rounded-md pl-10 pr-4 py-2.5 text-sm outline-none border border-transparent focus:border-gold/40"
          />
        </div>
        <div className="flex gap-1 overflow-x-auto">
          {cats.map((c) => (
            <button
              key={c}
              onClick={() => setCat(c)}
              className={`px-4 py-2 rounded-md text-xs uppercase tracking-widest whitespace-nowrap transition ${
                cat === c
                  ? "gold-gradient text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground"
              }`}
            >
              {c}
            </button>
          ))}
        </div>
        <select
          value={currency}
          onChange={(e) => setCurrency(e.target.value as Cur)}
          className="bg-muted/50 rounded-md px-3 py-2.5 text-sm border border-transparent focus:border-gold/40"
        >
          <option value="USD">USD $</option>
          <option value="EUR">EUR €</option>
          <option value="GBP">GBP £</option>
          <option value="AED">AED</option>
        </select>
      </div>

      {error && (
        <div className="text-center py-16 text-destructive">
          Unable to load the collection. Please refresh.
        </div>
      )}

      {isLoading && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="aspect-[4/5] rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
      )}

      {!isLoading && !error && (
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {items.map((p, i) => {
            const priceCents = Math.round((p.price_cents / 100) * rate) * 100;
            const priceLabel = `${sym}${Math.round(priceCents / 100).toLocaleString()}`;
            const img = (p.image_url && IMG[p.image_url]) || p.image_url || p1;
            return (
              <div
                key={p.id}
                className="group animate-fade-up"
                style={{ animationDelay: `${Math.min(i, 8) * 60}ms` }}
              >
                <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-luxe hover-lift">
                  <img
                    src={img}
                    alt={p.name}
                    loading="lazy"
                    width={800}
                    height={1000}
                    className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-background via-background/10 to-transparent" />
                  {p.category && (
                    <div className="absolute top-3 left-3 text-[10px] uppercase tracking-widest text-gold bg-background/70 backdrop-blur px-2 py-1 rounded">
                      {p.category}
                    </div>
                  )}
                  {p.featured && (
                    <div className="absolute top-3 right-3 text-[10px] uppercase tracking-widest bg-gold text-primary-foreground px-2 py-1 rounded font-medium">
                      Featured
                    </div>
                  )}
                  <div className="absolute bottom-0 left-0 right-0 p-5">
                    <div className="font-display text-lg leading-tight">{p.name}</div>
                    <div className="mt-2 flex items-center justify-between gap-2">
                      <div className="gold-text font-medium">{priceLabel}</div>
                      <button
                        onClick={() => addToCart(p)}
                        className="text-xs uppercase tracking-widest border border-gold/40 text-gold px-3 py-1.5 rounded hover:gold-gradient hover:text-primary-foreground transition inline-flex items-center gap-1.5"
                      >
                        <ShoppingBag className="h-3 w-3" /> Acquire
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {!isLoading && !error && items.length === 0 && (
        <div className="text-center py-20 text-muted-foreground flex flex-col items-center gap-3">
          <Loader2 className="h-6 w-6 text-gold/50" />
          No items match your criteria.
        </div>
      )}
    </div>
  );
}
