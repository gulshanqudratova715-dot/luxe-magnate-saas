import { Link, useRouterState } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Menu, X, Sparkles, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/lib/cart-store";

const nav = [
  { to: "/", label: "Home" },
  { to: "/marketplace", label: "Marketplace" },
  { to: "/dashboard", label: "Dashboard" },
  { to: "/booking", label: "Consultations" },
  { to: "/checkout", label: "Checkout" },
];

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [user, setUser] = useState<User | null>(null);
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const { count, setOpen: setCartOpen } = useCart();

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setUser(data.session?.user ?? null));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setUser(session?.user ?? null);
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => setOpen(false), [pathname]);

  return (
    <header
      className={`sticky top-0 z-30 transition-all duration-500 ${
        scrolled ? "bg-background/85 backdrop-blur-xl border-b border-gold/10" : "bg-transparent"
      }`}
    >
      <div className="mx-auto max-w-7xl px-5 sm:px-8 h-16 sm:h-20 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4">
        <Link to="/" className="flex items-center gap-2 min-w-0">
          <div className="grid h-9 w-9 shrink-0 place-items-center rounded-md gold-gradient shadow-gold-glow">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-lg sm:text-xl font-bold tracking-widest gold-text truncate">
              LUXE MAGNATE
            </div>
            <div className="text-[10px] uppercase tracking-[0.3em] text-muted-foreground -mt-1 hidden sm:block">
              Owned and Operated by Gulshan
            </div>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-4">
          <nav className="hidden lg:flex items-center gap-8">
            {nav.map((item) => {
              const active = pathname === item.to;
              return (
                <Link
                  key={item.to}
                  to={item.to}
                  className={`relative text-sm tracking-wide transition-colors ${
                    active ? "text-gold" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                  {active && (
                    <span className="absolute -bottom-2 left-0 right-0 h-px gold-gradient" />
                  )}
                </Link>
              );
            })}
          </nav>

          <button
            onClick={() => setCartOpen(true)}
            aria-label="Open cart"
            className="relative grid h-10 w-10 place-items-center rounded-md border border-gold/25 text-gold hover:bg-muted/40 transition"
          >
            <ShoppingBag className="h-4 w-4" />
            {count > 0 && (
              <span className="absolute -top-1.5 -right-1.5 min-w-[18px] h-[18px] px-1 grid place-items-center rounded-full gold-gradient text-primary-foreground text-[10px] font-bold animate-scale-in">
                {count}
              </span>
            )}
          </button>

          <Link
            to="/auth"
            className="hidden sm:inline-flex gold-gradient text-primary-foreground px-4 lg:px-5 py-2 rounded-md font-medium text-sm hover-lift"
          >
            {user ? "Account" : "Sign in"}
          </Link>

          <button
            className="lg:hidden shrink-0 grid h-10 w-10 place-items-center rounded-md border border-gold/20 text-gold"
            onClick={() => setOpen((v) => !v)}
            aria-label="Toggle menu"
          >
            {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {open && (
        <div className="lg:hidden border-t border-gold/10 bg-background/95 backdrop-blur-xl animate-fade-up">
          <nav className="px-5 py-4 flex flex-col gap-1">
            {nav.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                className={`px-3 py-3 rounded-md text-sm ${
                  pathname === item.to
                    ? "text-gold bg-muted"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted/50"
                }`}
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/auth"
              className="mt-2 gold-gradient text-primary-foreground px-4 py-3 rounded-md font-medium text-center"
            >
              {user ? "Account" : "Sign in"}
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}
