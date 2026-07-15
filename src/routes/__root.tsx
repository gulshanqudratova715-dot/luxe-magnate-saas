import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import {
  Outlet,
  Link,
  createRootRouteWithContext,
  useRouter,
  useRouterState as useRouterStateHook,
  HeadContent,
  Scripts,
} from "@tanstack/react-router";
import { useEffect, type ReactNode } from "react";

import appCss from "../styles.css?url";
import { reportLovableError } from "../lib/lovable-error-reporting";
import { SiteHeader } from "@/components/site-header";
import { SiteFooter } from "@/components/site-footer";
import { AiAssistant } from "@/components/ai-assistant";
import { CartProvider } from "@/lib/cart-store";
import { CartSidebar } from "@/components/cart-sidebar";
import { Toaster } from "@/components/ui/sonner";

function NotFoundComponent() {
  return (
    <div className="min-h-screen">
      <SiteHeader />
      <main className="flex min-h-[70vh] items-center justify-center px-6">
        <div className="text-center max-w-lg animate-fade-up">
          <div className="gold-text font-display text-[8rem] leading-none font-bold">404</div>
          <h1 className="mt-2 font-display text-3xl">This vault is empty</h1>
          <p className="mt-4 text-muted-foreground">
            The page you're seeking has been moved, retired, or never existed. Return to the atelier
            and continue your journey.
          </p>
          <div className="mt-8 flex gap-3 justify-center">
            <Link
              to="/"
              className="gold-gradient text-primary-foreground px-6 py-3 rounded-md font-medium hover-lift"
            >
              Return home
            </Link>
            <Link
              to="/marketplace"
              className="border border-gold/40 text-gold px-6 py-3 rounded-md hover-lift"
            >
              Browse marketplace
            </Link>
          </div>
        </div>
      </main>
      <SiteFooter />
    </div>
  );
}

function ErrorComponent({ error, reset }: { error: Error; reset: () => void }) {
  console.error(error);
  const router = useRouter();
  useEffect(() => {
    reportLovableError(error, { boundary: "tanstack_root_error_component" });
  }, [error]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center animate-fade-up">
        <h1 className="font-display text-2xl text-gold">Something interrupted us</h1>
        <p className="mt-3 text-sm text-muted-foreground">
          Our concierge is on it. Try again, or head back home.
        </p>
        <div className="mt-6 flex flex-wrap justify-center gap-2">
          <button
            onClick={() => {
              router.invalidate();
              reset();
            }}
            className="gold-gradient text-primary-foreground px-5 py-2 rounded-md font-medium"
          >
            Try again
          </button>
          <a href="/" className="border border-gold/40 text-gold px-5 py-2 rounded-md">
            Go home
          </a>
        </div>
      </div>
    </div>
  );
}

export const Route = createRootRouteWithContext<{ queryClient: QueryClient }>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "LUXE MAGNATE — Premium Marketplace & AI Automation" },
      {
        name: "description",
        content:
          "LUXE MAGNATE is the invitation-only marketplace for luxury goods and AI-powered business automation. Curated inventory, financial intelligence, private consultations.",
      },
      { name: "author", content: "LUXE MAGNATE" },
      { property: "og:title", content: "LUXE MAGNATE — Premium Marketplace & AI Automation" },
      {
        property: "og:description",
        content: "Curated luxury goods and enterprise-grade AI automation for the discerning few.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico", type: "image/x-icon" },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      {
        rel: "stylesheet",
        href: "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@500;600;700;800&family=Inter:wght@300;400;500;600;700&display=swap",
      },
    ],
    scripts: [
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Organization",
          name: "LUXE MAGNATE",
          description:
            "Invitation-only marketplace for luxury goods and AI-powered enterprise automation. Owned and Operated by Gulshan.",
          founder: { "@type": "Person", name: "Gulshan" },
          sameAs: [],
        }),
      },
      {
        type: "application/ld+json",
        children: JSON.stringify({
          "@context": "https://schema.org",
          "@type": "WebSite",
          name: "LUXE MAGNATE",
          copyrightHolder: { "@type": "Person", name: "Gulshan" },
          copyrightNotice: "Owned and Operated by Gulshan",
        }),
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
  errorComponent: ErrorComponent,
});

function RootShell({ children }: { children: ReactNode }) {
  return (
    <html lang="en" className="dark">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  const pathname = useRouterStateHook({ select: (s) => s.location.pathname });

  useEffect(() => {
    // Analytics pageview tracking (GA4 / Meta Pixel compatible stub)
    const w = window as unknown as {
      gtag?: (...args: unknown[]) => void;
      fbq?: (...args: unknown[]) => void;
      dataLayer?: unknown[];
    };
    w.dataLayer = w.dataLayer || [];
    w.dataLayer.push({ event: "page_view", page_path: pathname });
    w.gtag?.("event", "page_view", { page_path: pathname });
    w.fbq?.("track", "PageView");
  }, [pathname]);

  return (
    <QueryClientProvider client={queryClient}>
      <CartProvider>
        <div className="min-h-screen flex flex-col">
          <SiteHeader />
          <div className="flex-1">
            <Outlet />
          </div>
          <SiteFooter />
        </div>
        <CartSidebar />
        <AiAssistant />
        <Toaster />
      </CartProvider>
    </QueryClientProvider>
  );
}
