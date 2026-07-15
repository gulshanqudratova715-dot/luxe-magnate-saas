import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { ArrowRight, ShieldCheck, Sparkles, TrendingUp, Calculator } from "lucide-react";
import hero from "@/assets/hero.jpg";
import p1 from "@/assets/product-1.jpg";
import p2 from "@/assets/product-2.jpg";
import p3 from "@/assets/product-3.jpg";
import p4 from "@/assets/product-4.jpg";
import { FinancialCalculator } from "@/components/financial-calculator";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "LUXE MAGNATE — Premium Marketplace & AI Automation" },
      {
        name: "description",
        content:
          "Curated luxury inventory, financial intelligence, and AI-powered enterprise automation. Invitation-only.",
      },
    ],
  }),
  component: Home,
});

const featured = [
  { img: p1, name: "Grand Cru Reserve Decanter", price: "$8,400", cat: "Rare Spirits" },
  { img: p2, name: "Obsidian Tourbillon Automatic", price: "$42,900", cat: "Horology" },
  { img: p3, name: "Sentinel AI Orchestration", price: "$18,000/mo", cat: "Automation" },
  { img: p4, name: "Noir Executive Attaché", price: "$3,650", cat: "Leather Goods" },
];

function Home() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* HERO */}
      <section className="relative overflow-hidden">
        <div className="mx-auto max-w-7xl px-6 sm:px-8 pt-10 sm:pt-20 pb-16 sm:pb-28 grid gap-12 lg:grid-cols-2 items-center">
          <div className={`space-y-7 ${mounted ? "animate-fade-up" : "opacity-0"}`}>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full border border-gold/30 text-xs uppercase tracking-[0.25em] text-gold">
              <span className="h-1.5 w-1.5 rounded-full bg-gold animate-pulse" />
              Est. Premium · Invitation Only
            </div>
            <h1 className="font-display text-5xl sm:text-6xl lg:text-7xl leading-[1.05] font-bold">
              Where <span className="gold-text italic">rarity</span> meets
              <br />
              <span className="gold-text">intelligence</span>.
            </h1>
            <p className="text-lg text-muted-foreground max-w-xl leading-relaxed">
              LUXE MAGNATE is the private marketplace uniting hand-curated luxury goods with
              enterprise-grade AI automation — engineered for principals, operators, and collectors
              who demand more.
            </p>
            <div className="flex flex-wrap gap-4">
              <Link
                to="/marketplace"
                className="group gold-gradient text-primary-foreground px-7 py-3.5 rounded-md font-medium inline-flex items-center gap-2 hover-lift shadow-gold-glow"
              >
                Enter marketplace
                <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
              </Link>
              <Link
                to="/booking"
                className="border border-gold/40 text-gold px-7 py-3.5 rounded-md hover-lift"
              >
                Book consultation
              </Link>
            </div>
            <div className="grid grid-cols-3 gap-4 pt-8 border-t border-gold/10 max-w-md">
              {[
                ["$2.4B+", "Transacted"],
                ["1,200+", "Members"],
                ["48hrs", "Concierge"],
              ].map(([v, l]) => (
                <div key={l}>
                  <div className="font-display text-2xl gold-text">{v}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1">
                    {l}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div
            className={`relative ${mounted ? "animate-fade-up" : "opacity-0"}`}
            style={{ animationDelay: "150ms" }}
          >
            <div className="relative aspect-square rounded-2xl overflow-hidden shadow-luxe animate-float">
              <img
                src={hero}
                alt="LUXE MAGNATE — curated luxury and AI automation"
                width={1024}
                height={1024}
                className="h-full w-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-background/60 via-transparent to-transparent" />
            </div>
            <div className="absolute -bottom-6 -left-6 glass rounded-xl px-5 py-4 shadow-luxe hidden sm:block">
              <div className="flex items-center gap-3">
                <div className="grid h-10 w-10 place-items-center rounded-full gold-gradient">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-widest text-muted-foreground">
                    Vault index
                  </div>
                  <div className="font-display gold-text text-lg">+18.4% YoY</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* PILLARS */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 py-16 grid gap-6 sm:grid-cols-3">
        {[
          {
            icon: ShieldCheck,
            title: "Provenance verified",
            body: "Every listing is authenticated and insured before it reaches you.",
          },
          {
            icon: Sparkles,
            title: "AI-orchestrated",
            body: "Automation packages that operate your business at institutional scale.",
          },
          {
            icon: TrendingUp,
            title: "Financial intelligence",
            body: "Bespoke financing, hedging, and portfolio tooling built in.",
          },
        ].map((f, i) => (
          <div
            key={f.title}
            className="glass rounded-xl p-6 hover-lift animate-fade-up"
            style={{ animationDelay: `${i * 100}ms` }}
          >
            <div className="grid h-11 w-11 place-items-center rounded-md gold-gradient mb-4">
              <f.icon className="h-5 w-5 text-primary-foreground" />
            </div>
            <div className="font-display text-xl mb-2">{f.title}</div>
            <p className="text-sm text-muted-foreground leading-relaxed">{f.body}</p>
          </div>
        ))}
      </section>

      {/* FEATURED */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 py-16">
        <div className="flex items-end justify-between mb-10">
          <div>
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-3">The Collection</div>
            <h2 className="font-display text-4xl sm:text-5xl">Featured this week</h2>
          </div>
          <Link
            to="/marketplace"
            className="hidden sm:inline-flex items-center gap-2 text-sm text-gold hover:gap-3 transition-all"
          >
            View all <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
          {featured.map((p, i) => (
            <Link
              key={p.name}
              to="/marketplace"
              className="group animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <div className="relative aspect-[4/5] rounded-xl overflow-hidden shadow-luxe hover-lift">
                <img
                  src={p.img}
                  alt={p.name}
                  loading="lazy"
                  width={800}
                  height={1000}
                  className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-105"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-transparent" />
                <div className="absolute bottom-0 left-0 right-0 p-5">
                  <div className="text-[10px] uppercase tracking-widest text-gold mb-1">
                    {p.cat}
                  </div>
                  <div className="font-display text-lg leading-tight">{p.name}</div>
                  <div className="mt-2 gold-text font-medium">{p.price}</div>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* CALCULATOR */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 py-16">
        <div className="grid gap-10 lg:grid-cols-[1fr_1.2fr] items-center">
          <div className="animate-fade-up">
            <div className="text-xs uppercase tracking-[0.25em] text-gold mb-3">
              Financial Intelligence
            </div>
            <h2 className="font-display text-4xl sm:text-5xl mb-4">Model your acquisition.</h2>
            <p className="text-muted-foreground leading-relaxed max-w-md">
              Configure principal, term, and rate. Our engine projects amortization, total interest,
              and monthly cash flow in real time — the same tools our private wealth desk uses.
            </p>
            <div className="mt-6 inline-flex items-center gap-2 text-sm text-gold">
              <Calculator className="h-4 w-4" /> Live simulation
            </div>
          </div>
          <FinancialCalculator />
        </div>
      </section>

      {/* CTA */}
      <section className="mx-auto max-w-7xl px-6 sm:px-8 py-20">
        <div className="glass rounded-3xl p-10 sm:p-16 text-center shadow-luxe relative overflow-hidden">
          <div className="absolute inset-0 gold-gradient opacity-[0.04]" />
          <div className="relative">
            <h2 className="font-display text-4xl sm:text-5xl mb-4">Membership is by invitation.</h2>
            <p className="text-muted-foreground max-w-xl mx-auto mb-8">
              Request access to unlock the full marketplace, private consultations, and AI
              automation.
            </p>
            <Link
              to="/auth"
              className="gold-gradient text-primary-foreground px-8 py-4 rounded-md font-medium inline-flex items-center gap-2 hover-lift shadow-gold-glow"
            >
              Request invitation <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
