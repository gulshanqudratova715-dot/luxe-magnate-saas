import { Link } from "@tanstack/react-router";

export function SiteFooter() {
  return (
    <footer className="mt-24 border-t border-gold/10 bg-background/60">
      <div className="mx-auto max-w-7xl px-6 sm:px-8 py-14 grid gap-10 md:grid-cols-4">
        <div className="md:col-span-2">
          <div className="font-display text-2xl gold-text tracking-widest">LUXE MAGNATE</div>
          <p className="mt-4 text-sm text-muted-foreground max-w-sm leading-relaxed">
            An invitation-only marketplace uniting rare luxury goods with enterprise-grade AI
            automation. Crafted for the discerning few.
          </p>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Marketplace</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/marketplace" className="hover:text-foreground">
                Collections
              </Link>
            </li>
            <li>
              <Link to="/dashboard" className="hover:text-foreground">
                Vendor console
              </Link>
            </li>
            <li>
              <Link to="/checkout" className="hover:text-foreground">
                Secure checkout
              </Link>
            </li>
          </ul>
        </div>
        <div>
          <div className="text-xs uppercase tracking-[0.25em] text-gold mb-4">Concierge</div>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li>
              <Link to="/booking" className="hover:text-foreground">
                Private consultation
              </Link>
            </li>
            <li>
              <Link to="/auth" className="hover:text-foreground">
                Membership
              </Link>
            </li>
            <li>
              <a href="#" className="hover:text-foreground">
                Contact concierge
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t border-gold/10 py-5 text-center text-xs text-muted-foreground space-y-1">
        <div>© {new Date().getFullYear()} LUXE MAGNATE. All rights reserved.</div>
        <div className="text-gold/80 tracking-widest uppercase">Owned and Operated by Gulshan</div>
      </div>
    </footer>
  );
}
