import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { createElement } from "react";
import { supabase } from "@/integrations/supabase/client";

export type CartItem = {
  id: string; // product_id
  name: string;
  price_cents: number;
  image_url: string | null;
  category: string | null;
  qty: number;
};

type Ctx = {
  items: CartItem[];
  count: number;
  subtotalCents: number;
  add: (item: Omit<CartItem, "qty">, qty?: number) => Promise<void>;
  remove: (id: string) => Promise<void>;
  setQty: (id: string, qty: number) => Promise<void>;
  clear: () => Promise<void>;
  open: boolean;
  setOpen: (v: boolean) => void;
  userId: string | null;
  syncing: boolean;
};

const CartContext = createContext<Ctx | null>(null);
const KEY = "luxe-cart-v1";

interface SupabaseCartRow {
  qty: number;
  product_id: string;
  products: {
    id: string;
    name: string;
    price_cents: number;
    image_url: string;
    category: string;
  };
}

async function fetchRemoteCart(userId: string): Promise<CartItem[]> {
  const { data, error } = await supabase
    .from("carts")
    .select("qty, product_id, products:products!inner(id,name,price_cents,image_url,category)")
    .eq("user_id", userId);
  if (error) throw error;
  return ((data as unknown as SupabaseCartRow[]) ?? []).map((row) => ({
    id: row.products.id,
    name: row.products.name,
    price_cents: row.products.price_cents,
    image_url: row.products.image_url,
    category: row.products.category,
    qty: row.qty,
  }));
}

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [userId, setUserId] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const itemsRef = useRef<CartItem[]>([]);
  itemsRef.current = items;

  // Auth listener → track user id
  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUserId(data.session?.user.id ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUserId(session?.user.id ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  // Hydrate + realtime sync
  useEffect(() => {
    if (!userId) {
      try {
        const raw = localStorage.getItem(KEY);
        setItems(raw ? JSON.parse(raw) : []);
      } catch {
        setItems([]);
      }
      return;
    }
    let cancelled = false;
    setSyncing(true);
    (async () => {
      try {
        // Merge any local guest cart into DB on first sign-in
        const raw = localStorage.getItem(KEY);
        const guest: CartItem[] = raw ? JSON.parse(raw) : [];
        if (guest.length) {
          await Promise.all(
            guest.map((g) =>
              supabase
                .from("carts")
                .upsert(
                  { user_id: userId, product_id: g.id, qty: g.qty },
                  { onConflict: "user_id,product_id" },
                ),
            ),
          );
          localStorage.removeItem(KEY);
        }
        const remote = await fetchRemoteCart(userId);
        if (!cancelled) setItems(remote);
      } catch (e) {
        console.error("[cart] hydrate failed", e);
      } finally {
        if (!cancelled) setSyncing(false);
      }
    })();

    const channel = supabase
      .channel(`carts:${userId}`)
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "carts", filter: `user_id=eq.${userId}` },
        async () => {
          try {
            setItems(await fetchRemoteCart(userId));
          } catch (e) {
            console.error(e);
          }
        },
      )
      .subscribe();

    return () => {
      cancelled = true;
      supabase.removeChannel(channel);
    };
  }, [userId]);

  // Persist guest cart to localStorage
  useEffect(() => {
    if (userId) return;
    try {
      localStorage.setItem(KEY, JSON.stringify(items));
    } catch {
      /* ignore */
    }
  }, [items, userId]);

  const value = useMemo<Ctx>(
    () => ({
      items,
      count: items.reduce((n, i) => n + i.qty, 0),
      subtotalCents: items.reduce((n, i) => n + i.qty * i.price_cents, 0),
      userId,
      syncing,
      open,
      setOpen,
      add: async (item, qty = 1) => {
        setItems((prev) => {
          const found = prev.find((p) => p.id === item.id);
          if (found) return prev.map((p) => (p.id === item.id ? { ...p, qty: p.qty + qty } : p));
          return [...prev, { ...item, qty }];
        });
        if (userId) {
          const existing = itemsRef.current.find((p) => p.id === item.id);
          const nextQty = (existing?.qty ?? 0) + qty;
          await supabase
            .from("carts")
            .upsert(
              { user_id: userId, product_id: item.id, qty: nextQty },
              { onConflict: "user_id,product_id" },
            );
        }
      },
      remove: async (id) => {
        setItems((prev) => prev.filter((p) => p.id !== id));
        if (userId)
          await supabase.from("carts").delete().eq("user_id", userId).eq("product_id", id);
      },
      setQty: async (id, qty) => {
        setItems((prev) =>
          qty <= 0
            ? prev.filter((p) => p.id !== id)
            : prev.map((p) => (p.id === id ? { ...p, qty } : p)),
        );
        if (userId) {
          if (qty <= 0) {
            await supabase.from("carts").delete().eq("user_id", userId).eq("product_id", id);
          } else {
            await supabase
              .from("carts")
              .upsert(
                { user_id: userId, product_id: id, qty },
                { onConflict: "user_id,product_id" },
              );
          }
        }
      },
      clear: async () => {
        setItems([]);
        if (userId) await supabase.from("carts").delete().eq("user_id", userId);
      },
    }),
    [items, open, userId, syncing],
  );

  return createElement(CartContext.Provider, { value }, children);
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used inside CartProvider");
  return ctx;
}
