import { Link } from "@tanstack/react-router";
import { Minus, Plus, ShoppingBag, Trash2, X } from "lucide-react";
import { useCart } from "@/lib/cart-store";

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

export function CartSidebar() {
  const { items, count, subtotalCents, setQty, remove, open, setOpen, clear } = useCart();

  return (
    <>
      <div
        onClick={() => setOpen(false)}
        className={`fixed inset-0 z-40 bg-background/70 backdrop-blur-sm transition-opacity duration-300 ${
          open ? "opacity-100" : "opacity-0 pointer-events-none"
        }`}
      />
      <aside
        className={`fixed right-0 top-0 z-50 h-full w-[min(420px,100vw)] bg-card border-l border-gold/20 shadow-luxe flex flex-col transition-transform duration-500 ${
          open ? "translate-x-0" : "translate-x-full"
        }`}
        aria-hidden={!open}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gold/15">
          <div className="flex items-center gap-3">
            <div className="grid h-9 w-9 place-items-center rounded-md gold-gradient">
              <ShoppingBag className="h-4 w-4 text-primary-foreground" />
            </div>
            <div>
              <div className="font-display gold-text">Your Vault</div>
              <div className="text-[11px] uppercase tracking-widest text-muted-foreground">
                {count} {count === 1 ? "piece" : "pieces"} reserved
              </div>
            </div>
          </div>
          <button
            onClick={() => setOpen(false)}
            className="grid h-9 w-9 place-items-center rounded-md border border-gold/20 text-gold hover:bg-muted/50 transition"
            aria-label="Close cart"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
          {items.length === 0 && (
            <div className="text-center py-16 text-muted-foreground">
              <ShoppingBag className="h-8 w-8 mx-auto mb-3 text-gold/40" />
              <div className="text-sm">Your vault awaits.</div>
              <Link
                to="/marketplace"
                onClick={() => setOpen(false)}
                className="mt-4 inline-block text-xs uppercase tracking-widest text-gold border border-gold/30 px-4 py-2 rounded hover:gold-gradient hover:text-primary-foreground transition"
              >
                Browse marketplace
              </Link>
            </div>
          )}
          {items.map((it) => (
            <div
              key={it.id}
              className="flex gap-3 p-3 rounded-lg bg-muted/40 border border-gold/10 animate-fade-up"
            >
              <div className="h-20 w-20 shrink-0 rounded-md overflow-hidden bg-background">
                {it.image_url && (
                  <img
                    src={it.image_url}
                    alt={it.name}
                    className="h-full w-full object-cover"
                    loading="lazy"
                  />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <div className="text-[10px] uppercase tracking-widest text-gold/80">
                  {it.category}
                </div>
                <div className="text-sm font-medium truncate">{it.name}</div>
                <div className="gold-text text-sm mt-0.5">{fmt(it.price_cents)}</div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="flex items-center gap-1 bg-background rounded-md border border-gold/15">
                    <button
                      onClick={() => setQty(it.id, it.qty - 1)}
                      className="p-1.5 text-gold hover:bg-muted/50 rounded-l-md"
                      aria-label="Decrease"
                    >
                      <Minus className="h-3 w-3" />
                    </button>
                    <span className="text-xs w-6 text-center">{it.qty}</span>
                    <button
                      onClick={() => setQty(it.id, it.qty + 1)}
                      className="p-1.5 text-gold hover:bg-muted/50 rounded-r-md"
                      aria-label="Increase"
                    >
                      <Plus className="h-3 w-3" />
                    </button>
                  </div>
                  <button
                    onClick={() => remove(it.id)}
                    className="text-muted-foreground hover:text-destructive transition"
                    aria-label="Remove"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {items.length > 0 && (
          <div className="border-t border-gold/15 p-5 space-y-3 bg-background/50">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">Subtotal</span>
              <span className="font-display gold-text text-lg">{fmt(subtotalCents)}</span>
            </div>
            <div className="text-[11px] text-muted-foreground">
              Shipping, insurance & taxes calculated at checkout.
            </div>
            <Link
              to="/checkout"
              onClick={() => setOpen(false)}
              className="block text-center gold-gradient text-primary-foreground py-3 rounded-md font-medium hover-lift"
            >
              Proceed to checkout
            </Link>
            <button
              onClick={clear}
              className="w-full text-xs uppercase tracking-widest text-muted-foreground hover:text-destructive transition py-1"
            >
              Empty vault
            </button>
          </div>
        )}
      </aside>
    </>
  );
}
