import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import {
  TrendingUp,
  DollarSign,
  Package,
  Users,
  Calendar,
  ShoppingBag,
  User as UserIcon,
  LogOut,
  Loader2,
  Lock,
  CreditCard,
  Bell,
  CheckCircle2,
  XCircle,
  UserCheck,
  RefreshCw,
  FileText,
  AlertTriangle,
  Crown,
  Shield,
  Trash2,
  Star,
  Check,
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";
import { useCart } from "@/lib/cart-store";
import { FinancialCalculator } from "@/components/financial-calculator";
import { toast } from "sonner";

export const Route = createFileRoute("/dashboard")({
  head: () => ({
    meta: [
      { title: "Dashboard · LUXE MAGNATE" },
      {
        name: "description",
        content: "Your private dashboard: bookings, vault, and vendor analytics.",
      },
    ],
  }),
  component: Dashboard,
});

const revenue = [
  { m: "Jan", v: 42000 },
  { m: "Feb", v: 58000 },
  { m: "Mar", v: 71000 },
  { m: "Apr", v: 64000 },
  { m: "May", v: 92000 },
  { m: "Jun", v: 118000 },
  { m: "Jul", v: 134000 },
  { m: "Aug", v: 156000 },
  { m: "Sep", v: 172000 },
];
const catsData = [
  { name: "Horology", value: 42 },
  { name: "Spirits", value: 24 },
  { name: "Automation", value: 21 },
  { name: "Leather", value: 13 },
];
const orders = [
  { d: "Mon", v: 24 },
  { d: "Tue", v: 32 },
  { d: "Wed", v: 28 },
  { d: "Thu", v: 41 },
  { d: "Fri", v: 55 },
  { d: "Sat", v: 62 },
  { d: "Sun", v: 48 },
];
const chartColors = [
  "oklch(0.82 0.13 85)",
  "oklch(0.55 0.14 160)",
  "oklch(0.7 0.15 40)",
  "oklch(0.6 0.18 300)",
];

const fmt = (cents: number) =>
  (cents / 100).toLocaleString("en-US", {
    style: "currency",
    currency: "USD",
    maximumFractionDigits: 0,
  });

type Tab =
  | "overview"
  | "vault"
  | "bookings"
  | "notifications"
  | "vendor"
  | "subscription"
  | "settings"
  | "admin";

interface NotificationItem {
  id: string;
  title: string;
  description: string;
  time: string;
  read: boolean;
  type: "info" | "success" | "warning";
}

interface SavedCard {
  brand: "visa" | "mastercard" | "amex" | "generic";
  last4: string;
  exp: string;
  nameOnCard: string;
}

interface InvoiceItem {
  id: string;
  planName: string;
  price: string;
  interval: "monthly" | "annually";
  date: string;
  status: "PAID";
  brand: string;
  last4: string;
}

function Dashboard() {
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");
  const { items, count, subtotalCents, setOpen } = useCart();

  // Settings tab state
  const [profileDisplayName, setProfileDisplayName] = useState("");
  const [profileAvatarUrl, setProfileAvatarUrl] = useState("");
  const [updatingProfile, setUpdatingProfile] = useState(false);

  // Vendor listing form state
  const [prodName, setProdName] = useState("");
  const [prodDesc, setProdDesc] = useState("");
  const [prodPriceUsd, setProdPriceUsd] = useState("");
  const [prodCategory, setProdCategory] = useState("Timepieces");
  const [prodStock, setProdStock] = useState("10");
  const [prodImageUrl, setProdImageUrl] = useState("");
  const [listingProduct, setListingProduct] = useState(false);

  // Subscription cycle toggle
  const [billingInterval, setBillingInterval] = useState<"monthly" | "annually">("monthly");

  // Secure checkout dialog
  const [checkoutPlan, setCheckoutPlan] = useState<string | null>(null);
  const [cardNo, setCardNo] = useState("");
  const [cardExp, setCardExp] = useState("");
  const [cardCvc, setCardCvc] = useState("");
  const [cardName, setCardName] = useState("");
  const [isProcessingPayment, setIsProcessingPayment] = useState(false);
  const [paymentStep, setPaymentStep] = useState<"form" | "authorizing" | "success">("form");

  // User role state
  const [userRole, setUserRole] = useState<"admin" | "vendor" | "member">("member");

  // Local state saved card
  const [savedCard, setSavedCard] = useState<SavedCard | null>({
    brand: "visa",
    last4: "4242",
    exp: "12/28",
    nameOnCard: "Gulshan Q.",
  });

  // Simulated notifications list
  const [notifications, setNotifications] = useState<NotificationItem[]>([
    {
      id: "nt-1",
      title: "Welcome to LUXE MAGNATE",
      description: "Your secure private console has been successfully established and encrypted.",
      time: "Just now",
      read: false,
      type: "info",
    },
    {
      id: "nt-2",
      title: "Subscription Initialized",
      description: "You are currently allocated to the Elite plan with basic concierge access.",
      time: "5 minutes ago",
      read: false,
      type: "success",
    },
    {
      id: "nt-3",
      title: "Security Handshake Success",
      description: "SSL tunnel and JWT keys verified against Supabase Auth clusters.",
      time: "2 hours ago",
      read: true,
      type: "info",
    },
  ]);

  // Billing Invoice list
  const [invoices, setInvoices] = useState<InvoiceItem[]>([
    {
      id: "INV-2026-001",
      planName: "Elite Tier",
      price: "$99",
      interval: "monthly",
      date: "2026-07-15",
      status: "PAID",
      brand: "Visa",
      last4: "4242",
    },
  ]);

  // Card brand detection helper
  const getCardBrand = (num: string): "visa" | "mastercard" | "amex" | "generic" => {
    const raw = num.replace(/\s+/g, "");
    if (raw.startsWith("4")) return "visa";
    if (raw.startsWith("5")) return "mastercard";
    if (raw.startsWith("3")) return "amex";
    return "generic";
  };

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      const u = data.user;
      setUser(u ?? null);
      if (u) {
        // Platform Owner email gets immediate Admin role
        if (u.email === "gulshanqudratova715@gmail.com") {
          setUserRole("admin");
        } else {
          setUserRole(u.user_metadata?.role || "member");
        }
      }
      setLoadingUser(false);
    });

    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      const u = session?.user ?? null;
      setUser(u);
      if (u) {
        if (u.email === "gulshanqudratova715@gmail.com") {
          setUserRole("admin");
        } else {
          setUserRole(u.user_metadata?.role || "member");
        }
      }
    });
    return () => sub.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    const searchParams = new URLSearchParams(window.location.search);
    const checkoutSuccess = searchParams.get("checkout_success") === "true";
    const subSuccess = searchParams.get("subscription_success") === "true";
    const orderId = searchParams.get("order_id");
    const planName = searchParams.get("plan");

    if (checkoutSuccess && orderId) {
      toast.success("Secure Payment Verified!", {
        description: `Your order ${orderId} has been cleared and is now being prepared for handoff.`,
      });
      addNotification(
        "Secure Payment Completed",
        `Order ${orderId} has been successfully paid via Stripe Gateway. White glove delivery has been initiated.`,
        "success",
      );
      window.history.replaceState({}, document.title, window.location.pathname);
    }

    if (subSuccess && planName) {
      toast.success("Membership Active!", {
        description: `Welcome to your premium ${planName} Plan tier.`,
      });
      addNotification(
        "Membership Activated",
        `Your account has been upgraded to the ${planName} Plan with elite priority privileges.`,
        "success",
      );
      window.history.replaceState({}, document.title, window.location.pathname);
      supabase.auth.getUser().then(({ data }) => {
        setUser(data.user);
      });
    }
  }, [user]);

  const isAdmin = userRole === "admin" || user?.email === "gulshanqudratova715@gmail.com";

  // Queries
  const { data: profile, refetch: refetchProfile } = useQuery({
    queryKey: ["profile", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase.from("profiles").select("*").eq("id", user!.id).maybeSingle();
      return data;
    },
  });

  useEffect(() => {
    if (profile) {
      if (user?.email === "gulshanqudratova715@gmail.com") {
        setUserRole("admin");
      } else {
        setUserRole((profile.role as "admin" | "vendor" | "member") || "member");
      }
    }
  }, [profile, user]);

  const { data: bookings, refetch: refetchBookings } = useQuery({
    queryKey: ["bookings", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user!.id)
        .order("scheduled_at", { ascending: true });
      return data ?? [];
    },
  });

  const { data: userOrders, refetch: refetchUserOrders } = useQuery({
    queryKey: ["userOrders", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data } = await supabase
        .from("orders")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const paidOrders = useMemo(() => {
    return (userOrders ?? []).filter(
      (o) => o.status === "paid" || o.status === "completed" || o.status === "delivered",
    );
  }, [userOrders]);

  const dynamicInvoices = useMemo<InvoiceItem[]>(() => {
    const list: InvoiceItem[] = [];

    // 1. Subscription invoice
    if (profile && profile.subscription_tier && profile.subscription_tier !== "Free") {
      const isAnnually = billingInterval === "annually";
      const basePrice =
        profile.subscription_tier === "Elite"
          ? 99
          : profile.subscription_tier === "Magnate"
            ? 499
            : 1999;
      const actualPrice = isAnnually ? Math.round(basePrice * 0.8) : basePrice;
      list.push({
        id: "SUB-" + profile.id.slice(0, 8).toUpperCase(),
        planName: `${profile.subscription_tier} Membership`,
        price: `$${actualPrice}`,
        interval: isAnnually ? "annually" : "monthly",
        date: new Date(profile.created_at || Date.now()).toISOString().split("T")[0],
        status: "PAID",
        brand: savedCard?.brand.toUpperCase() || "STRIPE",
        last4: savedCard?.last4 || "VALT",
      });
    }

    // 2. Real paid orders
    paidOrders.forEach((o) => {
      list.push({
        id: "ORD-" + o.id.slice(0, 8).toUpperCase(),
        planName: "Marketplace Acquisition",
        price: fmt(o.total_cents),
        interval: "monthly",
        date: new Date(o.created_at).toISOString().split("T")[0],
        status: "PAID",
        brand: "STRIPE",
        last4: o.stripe_payment_intent ? o.stripe_payment_intent.slice(-4) : "SECURE",
      });
    });

    return list.length > 0 ? list : invoices;
  }, [profile, billingInterval, savedCard, invoices, paidOrders]);

  // Admin View Queries
  const { data: adminProfiles, refetch: refetchAdminProfiles } = useQuery({
    queryKey: ["adminProfiles"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: adminBookings, refetch: refetchAdminBookings } = useQuery({
    queryKey: ["adminBookings"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("bookings")
        .select("*")
        .order("scheduled_at", { ascending: false });
      return data ?? [];
    },
  });

  const { data: adminProducts, refetch: refetchAdminProducts } = useQuery({
    queryKey: ["adminProducts"],
    enabled: !!user && isAdmin,
    queryFn: async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      return data ?? [];
    },
  });

  // Sync profile display states
  useEffect(() => {
    if (profile) {
      setProfileDisplayName(profile.display_name || "");
      setProfileAvatarUrl(profile.avatar_url || "");
    } else if (user) {
      setProfileDisplayName(user.email?.split("@")[0] || "Member");
    }
  }, [profile, user]);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setUpdatingProfile(true);
    try {
      const { error: profileErr } = await supabase.from("profiles").upsert({
        id: user.id,
        display_name: profileDisplayName.trim(),
        avatar_url: profileAvatarUrl.trim() || null,
      });
      if (profileErr) throw profileErr;

      const { error: authErr } = await supabase.auth.updateUser({
        data: {
          display_name: profileDisplayName.trim(),
          avatar_url: profileAvatarUrl.trim() || null,
        },
      });
      if (authErr) throw authErr;

      await refetchProfile();
      toast.success("Profile details updated successfully!");

      // Log notification
      addNotification(
        "Profile adjustments persisted",
        "Your member moniker and credentials have been updated.",
        "success",
      );
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Failed to update profile.");
    } finally {
      setUpdatingProfile(false);
    }
  };

  const handleCreateListing = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    if (!prodName.trim() || !prodPriceUsd) {
      toast.error("Please specify a name and price for the luxury piece.");
      return;
    }

    setListingProduct(true);
    try {
      const priceCents = Math.round(parseFloat(prodPriceUsd) * 100);
      const stockVal = parseInt(prodStock) || 1;
      const finalImg = prodImageUrl.trim() || "/src/assets/product-1.jpg";

      const { error } = await supabase.from("products").insert({
        name: prodName.trim(),
        description: prodDesc.trim() || "Provenance-verified premium item.",
        price_cents: priceCents,
        currency: "USD",
        category: prodCategory,
        stock: stockVal,
        featured: false,
        image_url: finalImg,
        vendor_id: user.id,
      });

      if (error) throw error;

      toast.success("Listing published successfully!", {
        description: `${prodName} is now live on the curation marketplace.`,
      });

      addNotification(
        "New Piece Published",
        `Your listing '${prodName}' is now live on the curation catalog.`,
        "success",
      );

      setProdName("");
      setProdDesc("");
      setProdPriceUsd("");
      setProdImageUrl("");

      if (isAdmin) refetchAdminProducts();
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Failed to publish listing.");
    } finally {
      setListingProduct(false);
    }
  };

  const handleToggleFeatureProduct = async (prodId: string, current: boolean) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({ featured: !current })
        .eq("id", prodId);
      if (error) throw error;
      toast.success(`Product feature state changed.`);
      refetchAdminProducts();
    } catch (err) {
      toast.error("Failed to update feature status.");
    }
  };

  const handleDeleteProduct = async (prodId: string) => {
    if (!confirm("Are you sure you want to remove this piece from the atelier?")) return;
    try {
      const { error } = await supabase.from("products").delete().eq("id", prodId);
      if (error) throw error;
      toast.success(`Listing successfully removed.`);
      refetchAdminProducts();
    } catch (err) {
      toast.error("Failed to delete product.");
    }
  };

  const handleUpdateBooking = async (bookingId: string, status: string) => {
    try {
      const { error } = await supabase.from("bookings").update({ status }).eq("id", bookingId);
      if (error) throw error;

      toast.success(`Consultation successfully ${status}.`);
      refetchBookings();
      if (isAdmin) refetchAdminBookings();

      addNotification(
        `Consultation ${status.toUpperCase()}`,
        `A scheduling request has been updated to ${status} in real-time.`,
        "info",
      );
    } catch (err) {
      toast.error("Failed to update consultation status.");
    }
  };

  const handleUpgradeSubscription = (planName: string) => {
    setCheckoutPlan(planName);
    setPaymentStep("form");
    setCardNo("");
    setCardExp("");
    setCardCvc("");
    setCardName(profileDisplayName || "Premium Member");
  };

  const handleProcessSimulatedPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!checkoutPlan) return;

    if (cardNo.replace(/\s+/g, "").length < 13) {
      toast.error("Invalid simulated credit card number.");
      return;
    }

    setPaymentStep("authorizing");
    setIsProcessingPayment(true);

    try {
      // Step-by-step progress simulation to emulate actual Stripe webhooks and handshakes
      await new Promise((r) => setTimeout(r, 1200));
      // Handshake
      await new Promise((r) => setTimeout(r, 1000));

      const { error } = await supabase.auth.updateUser({
        data: {
          subscription_tier: checkoutPlan,
          subscription_status: "active",
        },
      });
      if (error) throw error;

      // Sync to profiles database table
      const { error: profileErr } = await supabase
        .from("profiles")
        .update({ subscription_tier: checkoutPlan })
        .eq("id", user.id);

      if (profileErr) {
        console.error("Failed to sync profile subscription_tier:", profileErr);
      } else {
        await refetchProfile();
      }

      const {
        data: { user: updatedUser },
      } = await supabase.auth.getUser();
      setUser(updatedUser);

      // Save card details locally
      const detected = getCardBrand(cardNo);
      const last4 = cardNo.replace(/\s+/g, "").slice(-4) || "4242";
      setSavedCard({
        brand: detected,
        last4,
        exp: cardExp,
        nameOnCard: cardName,
      });

      // Add Invoice
      const basePrice = checkoutPlan === "Elite" ? 99 : checkoutPlan === "Magnate" ? 499 : 1999;
      const actualPrice = billingInterval === "annually" ? Math.round(basePrice * 0.8) : basePrice;
      const fmtPrice = `$${actualPrice}`;

      const newInv: InvoiceItem = {
        id: `INV-2026-00${invoices.length + 1}`,
        planName: `${checkoutPlan} Tier`,
        price: fmtPrice,
        interval: billingInterval,
        date: new Date().toISOString().split("T")[0],
        status: "PAID",
        brand: detected.toUpperCase(),
        last4,
      };
      setInvoices((prev) => [newInv, ...prev]);

      // Trigger notification
      addNotification(
        "Subscription Upgraded Successfully",
        `Welcome to the ${checkoutPlan} Membership. A secure charge of ${fmtPrice} was cleared via simulated Stripe Gateway.`,
        "success",
      );

      setPaymentStep("success");
    } catch (err) {
      console.error(err);
      toast.error("Payment authorization failed. Refused by gateway.");
      setPaymentStep("form");
    } finally {
      setIsProcessingPayment(false);
    }
  };

  const addNotification = (
    title: string,
    description: string,
    type: "info" | "success" | "warning",
  ) => {
    const next: NotificationItem = {
      id: `nt-${Date.now()}`,
      title,
      description,
      time: "Just now",
      read: false,
      type,
    };
    setNotifications((prev) => [next, ...prev]);
  };

  const toggleReadNotification = (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: !n.read } : n)));
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    toast.success("Notifications inbox cleared.");
  };

  const handleDownloadInvoice = (inv: InvoiceItem) => {
    const receiptText = `================================================
                 LUXE MAGNATE
             SECURED PAYMENT RECEIPT
================================================
Invoice reference:   ${inv.id}
Date processed:      ${inv.date}
Client Name:         ${profileDisplayName || "Premium Atelier Member"}
Account email:       ${user?.email}
------------------------------------------------
Plan Details:        ${inv.planName} (${inv.interval.toUpperCase()})
Payment Gateway:     STRIPE SECURE (SIMULATED)
Card Details:        ${inv.brand} ending in **** ${inv.last4}
Total Settled:       ${inv.price} USD
Status:              PAID & FULLY COMPLETED
------------------------------------------------
This transaction is fully secure and verified.
Thank you for your valued patronage.
================================================`;

    const blob = new Blob([receiptText], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `Invoice-${inv.id}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    toast.success("Simulated invoice downloaded successfully.");
  };

  if (loadingUser) {
    return (
      <div className="mx-auto max-w-7xl px-6 py-16 space-y-6">
        <div className="h-10 w-64 bg-muted/40 animate-pulse rounded" />
        <div className="grid gap-4 sm:grid-cols-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 rounded-xl bg-muted/40 animate-pulse" />
          ))}
        </div>
        <div className="h-80 rounded-xl bg-muted/30 animate-pulse" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center animate-fade-up">
        <div className="grid h-14 w-14 mx-auto place-items-center rounded-full gold-gradient shadow-gold-glow mb-6">
          <UserIcon className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl">Sign in for your dashboard</h1>
        <p className="text-muted-foreground mt-3">
          Track bookings, review your vault, and access vendor analytics.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-block gold-gradient text-primary-foreground px-7 py-3 rounded-md font-medium hover-lift"
        >
          Sign in
        </Link>
      </div>
    );
  }

  const displayName = profile?.display_name || user.email?.split("@")[0] || "Member";
  const upcoming = (bookings ?? []).filter((b) => new Date(b.scheduled_at) >= new Date());
  const unreadCount = notifications.filter((n) => !n.read).length;

  // Real-time metrics calculations
  const lifetimeSpendCents = paidOrders.reduce((sum, o) => sum + Number(o.total_cents), 0);
  const formattedLifetimeSpend = lifetimeSpendCents > 0 ? fmt(lifetimeSpendCents) : "$0.00";

  // Concierge rating based on tier
  const tier = profile?.subscription_tier || "Elite";
  const conciergeScore =
    tier === "Sovereign" ? "S+" : tier === "Magnate" ? "S" : tier === "Elite" ? "A+" : "B";
  const conciergeLabel =
    tier === "Sovereign"
      ? "Sovereign tier"
      : tier === "Magnate"
        ? "Magnate tier"
        : tier === "Elite"
          ? "Elite tier"
          : "Standard member";

  return (
    <div className="mx-auto max-w-7xl px-6 sm:px-8 py-12 sm:py-16 space-y-8">
      {/* Header and Badge Panel */}
      <header className="flex flex-col md:flex-row md:items-center justify-between gap-6 animate-fade-up border-b border-gold/10 pb-6">
        <div className="min-w-0">
          <div className="flex items-center gap-3">
            <span className="text-xs uppercase tracking-[0.25em] text-gold font-medium">
              Secured Atelier Terminal
            </span>
            <span className="inline-flex items-center gap-1 bg-gold/10 border border-gold/30 text-gold text-[10px] uppercase tracking-widest px-2.5 py-0.5 rounded-full font-bold shadow-gold-glow">
              {isAdmin ? (
                <>
                  <Crown className="h-2.5 w-2.5" /> PLATINUM ADMIN
                </>
              ) : userRole === "vendor" ? (
                <>
                  <Shield className="h-2.5 w-2.5" /> VERIFIED VENDOR
                </>
              ) : (
                <>
                  <UserIcon className="h-2.5 w-2.5" /> MEMBER
                </>
              )}
            </span>
          </div>
          <h1 className="font-display text-3xl sm:text-5xl truncate mt-2">
            Welcome, {displayName}
          </h1>
          <p className="text-muted-foreground mt-1 text-sm">{user.email}</p>
        </div>
        <div className="flex items-center gap-3 shrink-0">
          <button
            onClick={() => setTab("notifications")}
            className="relative grid h-10 w-10 place-items-center rounded-md border border-gold/25 text-gold hover:bg-muted/40 transition"
            aria-label="Notifications"
          >
            <Bell className="h-4 w-4" />
            {unreadCount > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-[16px] px-1 grid place-items-center rounded-full bg-red-500 text-white text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
          </button>
          <button
            onClick={() => supabase.auth.signOut()}
            className="inline-flex items-center gap-2 border border-gold/30 text-gold px-4 py-2.5 rounded-md text-sm hover:bg-muted/40 transition font-medium"
          >
            <LogOut className="h-4 w-4" /> <span>Sign out</span>
          </button>
        </div>
      </header>

      {/* Tabs Navigation */}
      <div className="flex gap-1 overflow-x-auto border-b border-gold/10 pb-0.5 scrollbar-thin">
        {(
          [
            "overview",
            "vault",
            "bookings",
            "notifications",
            "vendor",
            "subscription",
            "settings",
            ...(isAdmin ? ["admin"] : []),
          ] as Tab[]
        ).map((t) => (
          <button
            key={t}
            onClick={() => setTab(t)}
            className={`px-5 py-3 text-xs uppercase tracking-widest whitespace-nowrap transition relative font-medium ${
              tab === t ? "text-gold" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t}
            {t === "notifications" && unreadCount > 0 && (
              <span className="ml-1 px-1.5 py-0.5 rounded-full bg-gold/15 text-gold text-[9px] font-bold">
                {unreadCount}
              </span>
            )}
            {tab === t && <span className="absolute bottom-0 left-2 right-2 h-0.5 gold-gradient" />}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB */}
      {tab === "overview" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: ShoppingBag, l: "Vault items", v: String(count), d: fmt(subtotalCents) },
              {
                i: Calendar,
                l: "Upcoming consults",
                v: String(upcoming.length),
                d: "Next 30 days",
              },
              {
                i: DollarSign,
                l: "Lifetime spend",
                v: formattedLifetimeSpend,
                d: "Securely verified",
              },
              { i: TrendingUp, l: "Concierge score", v: conciergeScore, d: conciergeLabel },
            ].map((k, i) => (
              <div
                key={k.l}
                className="glass rounded-xl p-5 hover-lift animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md gold-gradient">
                    <k.i className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-xs text-emerald">{k.d}</span>
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{k.l}</div>
                <div className="font-display text-2xl mt-1 gold-text">{k.v}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="glass rounded-xl p-6">
              <div className="text-xs uppercase tracking-widest text-gold mb-1">
                Financing calculator
              </div>
              <div className="font-display text-xl mb-4">Model any acquisition</div>
              <FinancialCalculator />
            </div>
            <div className="glass rounded-xl p-6 space-y-4">
              <div>
                <div className="text-xs uppercase tracking-widest text-gold">Quick actions</div>
                <div className="font-display text-xl">Concierge shortcuts</div>
              </div>
              <div className="grid gap-2">
                <Link
                  to="/marketplace"
                  className="flex items-center justify-between p-3 rounded-md bg-muted/40 hover:bg-muted/70 transition border border-gold/10"
                >
                  <span className="text-sm">Browse marketplace</span>
                  <span className="text-gold">→</span>
                </Link>
                <Link
                  to="/booking"
                  className="flex items-center justify-between p-3 rounded-md bg-muted/40 hover:bg-muted/70 transition border border-gold/10"
                >
                  <span className="text-sm">Book a consultation</span>
                  <span className="text-gold">→</span>
                </Link>
                <button
                  onClick={() => setOpen(true)}
                  className="flex items-center justify-between p-3 rounded-md bg-muted/40 hover:bg-muted/70 transition border border-gold/10 text-left w-full"
                >
                  <span className="text-sm">Open my vault ({count})</span>
                  <span className="text-gold">→</span>
                </button>
                <Link
                  to="/checkout"
                  className="flex items-center justify-between p-3 rounded-md gold-gradient text-primary-foreground font-medium hover-lift"
                >
                  <span className="text-sm">Proceed to checkout</span>
                  <span>→</span>
                </Link>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* VAULT TAB */}
      {tab === "vault" && (
        <div className="glass rounded-xl p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold">Reserved pieces</div>
              <div className="font-display text-xl">Your vault · {count} items</div>
            </div>
            {count > 0 && (
              <Link
                to="/checkout"
                className="gold-gradient text-primary-foreground px-4 py-2 rounded-md text-sm font-medium hover-lift"
              >
                Checkout · {fmt(subtotalCents)}
              </Link>
            )}
          </div>
          {items.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              Your vault is empty.{" "}
              <Link to="/marketplace" className="text-gold underline">
                Browse the collection
              </Link>
              .
            </div>
          ) : (
            <div className="divide-y divide-gold/10">
              {items.map((it) => (
                <div key={it.id} className="flex items-center gap-4 py-4">
                  <div className="h-16 w-16 rounded-md overflow-hidden bg-muted/40 shrink-0">
                    {it.image_url && (
                      <img
                        src={it.image_url}
                        alt={it.name}
                        className="h-full w-full object-cover"
                        referrerPolicy="no-referrer"
                      />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] uppercase tracking-widest text-gold/80">
                      {it.category}
                    </div>
                    <div className="text-sm truncate">{it.name}</div>
                  </div>
                  <div className="text-sm text-muted-foreground">×{it.qty}</div>
                  <div className="font-display gold-text w-28 text-right">
                    {fmt(it.price_cents * it.qty)}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* BOOKINGS TAB */}
      {tab === "bookings" && (
        <div className="glass rounded-xl p-6 animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold">Consultations</div>
              <div className="font-display text-xl">{bookings?.length ?? 0} on record</div>
            </div>
            <Link
              to="/booking"
              className="border border-gold/40 text-gold px-4 py-2 rounded-md text-sm hover:gold-gradient hover:text-primary-foreground transition font-medium"
            >
              Book new
            </Link>
          </div>
          {!bookings || bookings.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">No bookings yet.</div>
          ) : (
            <div className="divide-y divide-gold/10">
              {bookings.map((b) => (
                <div key={b.id} className="py-4 grid grid-cols-[auto_1fr_auto] items-center gap-4">
                  <div className="grid h-11 w-11 place-items-center rounded-md gold-gradient">
                    <Calendar className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <div className="min-w-0">
                    <div className="font-medium truncate">
                      {new Date(b.scheduled_at).toLocaleString("en-US", {
                        dateStyle: "medium",
                        timeStyle: "short",
                      })}
                    </div>
                    {b.notes && (
                      <div className="text-xs text-muted-foreground truncate mt-0.5">{b.notes}</div>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] uppercase tracking-widest px-2.5 py-1 rounded-full font-bold ${
                        b.status === "confirmed"
                          ? "bg-emerald/10 text-emerald border border-emerald/35"
                          : b.status === "cancelled" || b.status === "rejected"
                            ? "bg-red-500/10 text-red-400 border border-red-500/30"
                            : "bg-muted text-muted-foreground border border-gold/10"
                      }`}
                    >
                      {b.status}
                    </span>
                    {b.status === "pending" && (
                      <button
                        onClick={() => handleUpdateBooking(b.id, "cancelled")}
                        className="text-xs text-red-400 hover:text-red-300 ml-2"
                      >
                        Cancel
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* NOTIFICATIONS TAB */}
      {tab === "notifications" && (
        <div className="glass rounded-xl p-6 animate-fade-up space-y-6">
          <div className="flex items-center justify-between border-b border-gold/10 pb-4">
            <div>
              <div className="text-xs uppercase tracking-widest text-gold font-medium">Inbox</div>
              <h2 className="font-display text-2xl">Atelier Notifications</h2>
            </div>
            {notifications.length > 0 && (
              <button
                onClick={clearAllNotifications}
                className="text-xs border border-gold/30 text-gold px-3.5 py-1.5 rounded-md hover:bg-muted/40 transition font-medium"
              >
                Clear all
              </button>
            )}
          </div>

          {notifications.length === 0 ? (
            <div className="text-center py-16 text-muted-foreground">
              You are all caught up. No new secure events.
            </div>
          ) : (
            <div className="space-y-3">
              {notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => toggleReadNotification(n.id)}
                  className={`p-4 rounded-xl border transition cursor-pointer flex gap-4 ${
                    n.read
                      ? "bg-muted/20 border-gold/5 opacity-70"
                      : "bg-muted/45 border-gold/15 hover:border-gold/30 shadow-gold-glow"
                  }`}
                >
                  <div className="mt-1">
                    {n.type === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-emerald" />
                    ) : n.type === "warning" ? (
                      <AlertTriangle className="h-5 w-5 text-yellow-500" />
                    ) : (
                      <Bell className="h-5 w-5 text-gold" />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <div
                        className={`font-medium text-sm ${!n.read ? "gold-text" : "text-foreground"}`}
                      >
                        {n.title}
                      </div>
                      <span className="text-[10px] text-muted-foreground uppercase">{n.time}</span>
                    </div>
                    <div className="text-xs text-muted-foreground mt-1 leading-relaxed">
                      {n.description}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* VENDOR TAB */}
      {tab === "vendor" && (
        <div className="space-y-6 animate-fade-up">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              { i: DollarSign, l: "Revenue MTD", v: "$172,480", d: "+18.4%" },
              { i: Package, l: "Active listings", v: "48", d: "+4" },
              { i: Users, l: "Buyers reached", v: "1,284", d: "+22%" },
              { i: TrendingUp, l: "Conversion", v: "6.8%", d: "+1.2%" },
            ].map((k, i) => (
              <div
                key={k.l}
                className="glass rounded-xl p-5 hover-lift animate-fade-up"
                style={{ animationDelay: `${i * 80}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="grid h-9 w-9 place-items-center rounded-md gold-gradient">
                    <k.i className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <span className="text-xs text-emerald">{k.d}</span>
                </div>
                <div className="text-xs uppercase tracking-widest text-muted-foreground">{k.l}</div>
                <div className="font-display text-2xl mt-1 gold-text">{k.v}</div>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-3">
            <div className="glass rounded-xl p-6 lg:col-span-2">
              <div className="text-xs uppercase tracking-widest text-gold mb-1">
                Revenue trajectory
              </div>
              <div className="font-display text-xl mb-4">Last nine months</div>
              <div className="h-72">
                <ResponsiveContainer>
                  <AreaChart data={revenue} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="oklch(0.82 0.13 85)" stopOpacity={0.5} />
                        <stop offset="100%" stopColor="oklch(0.82 0.13 85)" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid
                      stroke="oklch(0.3 0.01 60)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="m"
                      stroke="oklch(0.6 0.02 80)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="oklch(0.6 0.02 80)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                      tickFormatter={(v) => `$${v / 1000}k`}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.012 60)",
                        border: "1px solid oklch(0.82 0.13 85 / 0.3)",
                        borderRadius: 8,
                      }}
                      formatter={(v) => `$${Number(v).toLocaleString()}`}
                    />
                    <Area
                      type="monotone"
                      dataKey="v"
                      stroke="oklch(0.82 0.13 85)"
                      strokeWidth={2.5}
                      fill="url(#rev)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="glass rounded-xl p-6">
              <div className="text-xs uppercase tracking-widest text-gold mb-1">Category mix</div>
              <div className="font-display text-xl mb-4">Revenue share</div>
              <div className="h-72">
                <ResponsiveContainer>
                  <PieChart>
                    <Pie
                      data={catsData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={50}
                      outerRadius={90}
                      stroke="none"
                    >
                      {catsData.map((_, i) => (
                        <Cell key={i} fill={chartColors[i % chartColors.length]} />
                      ))}
                    </Pie>
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.012 60)",
                        border: "1px solid oklch(0.82 0.13 85 / 0.3)",
                        borderRadius: 8,
                      }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="mt-2 grid grid-cols-2 gap-2 text-xs">
                {catsData.map((c, i) => (
                  <div key={c.name} className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full" style={{ background: chartColors[i] }} />
                    <span className="text-muted-foreground truncate">{c.name}</span>
                    <span className="ml-auto gold-text">{c.value}%</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="glass rounded-xl p-6 lg:col-span-3">
              <div className="text-xs uppercase tracking-widest text-gold mb-1">Weekly orders</div>
              <div className="font-display text-xl mb-4">Volume this week</div>
              <div className="h-56">
                <ResponsiveContainer>
                  <BarChart data={orders}>
                    <CartesianGrid
                      stroke="oklch(0.3 0.01 60)"
                      strokeDasharray="3 3"
                      vertical={false}
                    />
                    <XAxis
                      dataKey="d"
                      stroke="oklch(0.6 0.02 80)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <YAxis
                      stroke="oklch(0.6 0.02 80)"
                      fontSize={11}
                      tickLine={false}
                      axisLine={false}
                    />
                    <Tooltip
                      contentStyle={{
                        background: "oklch(0.18 0.012 60)",
                        border: "1px solid oklch(0.82 0.13 85 / 0.3)",
                        borderRadius: 8,
                      }}
                    />
                    <Bar dataKey="v" fill="oklch(0.82 0.13 85)" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* List New Product */}
            <div className="glass rounded-xl p-6 lg:col-span-3 animate-fade-up">
              <div className="text-xs uppercase tracking-widest text-gold mb-1">
                Product Atelier
              </div>
              <h3 className="font-display text-xl mb-4">List a new luxury piece</h3>
              <form onSubmit={handleCreateListing} className="grid sm:grid-cols-2 gap-4">
                <label className="block sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Item Name</span>
                  <input
                    type="text"
                    required
                    value={prodName}
                    onChange={(e) => setProdName(e.target.value)}
                    placeholder="e.g. Imperial Rose Gold Tourbillon"
                    className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
                  />
                </label>
                <label className="block sm:col-span-2">
                  <span className="text-xs text-muted-foreground">Description</span>
                  <textarea
                    required
                    value={prodDesc}
                    onChange={(e) => setProdDesc(e.target.value)}
                    placeholder="Provide details of authentication, materials, and artisan history..."
                    className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none h-20 resize-none transition"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Price (USD)</span>
                  <input
                    type="number"
                    required
                    value={prodPriceUsd}
                    onChange={(e) => setProdPriceUsd(e.target.value)}
                    placeholder="e.g. 25000"
                    className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Category</span>
                  <select
                    value={prodCategory}
                    onChange={(e) => setProdCategory(e.target.value)}
                    className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
                  >
                    <option value="Timepieces">Timepieces</option>
                    <option value="Spirits">Spirits</option>
                    <option value="Writing">Writing</option>
                    <option value="Leather">Leather</option>
                    <option value="Automation">Automation</option>
                  </select>
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Initial Stock</span>
                  <input
                    type="number"
                    required
                    value={prodStock}
                    onChange={(e) => setProdStock(e.target.value)}
                    placeholder="10"
                    className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
                  />
                </label>
                <label className="block">
                  <span className="text-xs text-muted-foreground">Image URL (Optional)</span>
                  <input
                    type="text"
                    value={prodImageUrl}
                    onChange={(e) => setProdImageUrl(e.target.value)}
                    placeholder="e.g. /src/assets/product-1.jpg"
                    className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
                  />
                </label>
                <div className="sm:col-span-2 pt-2">
                  <button
                    type="submit"
                    disabled={listingProduct}
                    className="w-full gold-gradient text-primary-foreground py-2.5 rounded-md font-medium text-sm disabled:opacity-60 hover-lift flex items-center justify-center gap-1.5"
                  >
                    {listingProduct ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Publishing piece...
                      </>
                    ) : (
                      "Publish to Marketplace"
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* SUBSCRIPTION & BILLING TAB */}
      {tab === "subscription" && (
        <div className="space-y-6 animate-fade-up">
          {/* Main Plan Status */}
          <div className="glass rounded-xl p-6">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gold/10 pb-6 mb-6">
              <div>
                <h2 className="font-display text-2xl mb-1">Atelier Membership</h2>
                <p className="text-muted-foreground text-sm">
                  Review and upgrade your subscription tier, manage billing logs, and save
                  multi-currency payment cards.
                </p>
              </div>
              <div className="flex items-center gap-2 bg-muted/60 p-1.5 rounded-lg border border-gold/15">
                <button
                  onClick={() => setBillingInterval("monthly")}
                  className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-medium transition ${
                    billingInterval === "monthly"
                      ? "gold-gradient text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Monthly
                </button>
                <button
                  onClick={() => setBillingInterval("annually")}
                  className={`px-3 py-1.5 rounded text-xs uppercase tracking-wider font-medium transition ${
                    billingInterval === "annually"
                      ? "gold-gradient text-primary-foreground font-semibold"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  Annually (-20%)
                </button>
              </div>
            </div>

            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground block">
                  Active Tier Plan
                </span>
                <span className="font-display text-xl gold-text block mt-0.5">
                  {user?.user_metadata?.subscription_tier || "Elite"} Plan
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground block">
                  Security / Status
                </span>
                <span className="inline-flex items-center gap-1.5 text-xs text-emerald font-medium mt-1">
                  <span className="h-2 w-2 rounded-full bg-emerald animate-pulse" />
                  Active / Good Standing
                </span>
              </div>
              <div>
                <span className="text-xs uppercase tracking-widest text-muted-foreground block">
                  Next Invoice Date
                </span>
                <span className="text-sm text-foreground block mt-0.5 font-medium">
                  August 15, 2026 (via Stripe Vault)
                </span>
              </div>
            </div>
          </div>

          {/* Saved Payment Method Section */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="glass rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg gold-text flex items-center gap-2">
                <CreditCard className="h-4 w-4" /> Secure Payment Method
              </h3>
              <p className="text-xs text-muted-foreground">
                Your payment details are secured via fully compliant PCI-DSS Level 1 tokenized
                handshakes.
              </p>

              {savedCard ? (
                <div className="p-4 rounded-xl border border-gold/25 bg-muted/30 flex items-center justify-between relative overflow-hidden shadow-gold-glow animate-fade-up">
                  <div className="flex items-center gap-3">
                    <div className="grid h-10 w-10 place-items-center rounded-lg bg-gold/15 border border-gold/30">
                      <Lock className="h-4 w-4 text-gold" />
                    </div>
                    <div>
                      <span className="text-xs uppercase font-bold tracking-widest text-gold block">
                        {savedCard.brand.toUpperCase()} Credit Card
                      </span>
                      <span className="text-sm font-mono text-foreground block mt-0.5">
                        •••• •••• •••• {savedCard.last4}
                      </span>
                      <span className="text-[10px] text-muted-foreground block">
                        Expiry: {savedCard.exp} · Holder: {savedCard.nameOnCard}
                      </span>
                    </div>
                  </div>
                  <button
                    onClick={() => {
                      setSavedCard(null);
                      toast.success("Saved credit card removed.");
                    }}
                    className="text-xs text-red-400 hover:text-red-300 transition"
                  >
                    Remove
                  </button>
                </div>
              ) : (
                <div className="p-8 rounded-xl border border-dashed border-gold/15 bg-muted/10 text-center text-xs text-muted-foreground">
                  No payment method on file. Add one on checkout or upgrade.
                </div>
              )}
            </div>

            {/* Invoices */}
            <div className="glass rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg gold-text flex items-center gap-2">
                <FileText className="h-4 w-4" /> Billing Receipts
              </h3>
              <p className="text-xs text-muted-foreground">
                View historic charges and securely download verified plain-text transaction logs.
              </p>

              <div className="divide-y divide-gold/10 space-y-2">
                {dynamicInvoices.map((inv) => (
                  <div
                    key={inv.id}
                    className="flex items-center justify-between py-2 animate-fade-up"
                  >
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground">{inv.planName}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {inv.date} · via {inv.brand} (*** {inv.last4})
                      </div>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className="text-xs font-mono font-bold gold-text">{inv.price}</span>
                      <button
                        onClick={() => handleDownloadInvoice(inv)}
                        className="text-[10px] uppercase border border-gold/25 text-gold hover:bg-gold/10 px-2.5 py-1 rounded transition font-medium"
                      >
                        Receipt
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid gap-6 md:grid-cols-3">
            {[
              {
                name: "Elite",
                price: "$99",
                priceAnnually: "$79",
                perks: [
                  "Access to standard curations",
                  "Concierge chat assistant",
                  "Verified shipping authentication",
                  "Standard 10% acquisition credit",
                ],
              },
              {
                name: "Magnate",
                price: "$499",
                priceAnnually: "$399",
                perks: [
                  "Bespoke luxury financing modeling",
                  "Direct hotlines to brand specialists",
                  "Zero-fee white-glove logistics",
                  "Priority asset allocation",
                ],
              },
              {
                name: "Sovereign",
                price: "$1,999",
                priceAnnually: "$1,599",
                perks: [
                  "Complete enterprise automation setups",
                  "Dedicated live account managers",
                  "Unlimited consult scheduling",
                  "Exclusive off-market private listings",
                ],
              },
            ].map((plan) => {
              const currentTier = user?.user_metadata?.subscription_tier || "Elite";
              const isActive = currentTier === plan.name;
              const displayPrice = billingInterval === "annually" ? plan.priceAnnually : plan.price;

              return (
                <div
                  key={plan.name}
                  className={`glass rounded-xl p-6 flex flex-col justify-between transition relative ${
                    isActive
                      ? "border-gold/60 shadow-gold-glow"
                      : "border-gold/10 hover:border-gold/30"
                  }`}
                >
                  {isActive && (
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gold text-primary-foreground text-[10px] uppercase tracking-widest px-3 py-1 rounded-full font-medium shadow-gold-glow">
                      Active Tier
                    </span>
                  )}
                  <div>
                    <h3 className="font-display text-xl mb-1">{plan.name}</h3>
                    <div className="flex items-baseline gap-1 mb-6">
                      <span className="text-2xl font-bold gold-text">{displayPrice}</span>
                      <span className="text-xs text-muted-foreground">/ month</span>
                    </div>
                    <ul className="space-y-3 mb-8">
                      {plan.perks.map((p) => (
                        <li
                          key={p}
                          className="text-sm text-muted-foreground flex items-start gap-2"
                        >
                          <span className="text-gold mt-1">✓</span>
                          <span>{p}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <button
                    disabled={isActive}
                    onClick={() => handleUpgradeSubscription(plan.name)}
                    className={`w-full py-2.5 rounded-md text-sm font-medium transition ${
                      isActive
                        ? "bg-gold/10 text-gold border border-gold/20 cursor-default"
                        : "gold-gradient text-primary-foreground hover-lift"
                    }`}
                  >
                    {isActive ? "Active" : `Switch to ${plan.name}`}
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* STRIPE PAYMENT SIMULATOR DIALOG */}
      {checkoutPlan && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm grid place-items-center px-4">
          <div className="w-full max-w-md glass rounded-2xl border border-gold/20 p-6 sm:p-8 relative shadow-luxe">
            <button
              onClick={() => {
                if (!isProcessingPayment) setCheckoutPlan(null);
              }}
              className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition text-sm"
              disabled={isProcessingPayment}
            >
              <XCircle className="h-5 w-5" />
            </button>

            {paymentStep === "form" && (
              <div className="space-y-5">
                <div className="text-center">
                  <div className="grid h-10 w-10 place-items-center rounded-full gold-gradient mx-auto mb-3 shadow-gold-glow">
                    <Lock className="h-4 w-4 text-primary-foreground" />
                  </div>
                  <h3 className="font-display text-xl gold-text">Secure Stripe Gateway</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Upgrading to{" "}
                    <span className="font-semibold text-foreground">{checkoutPlan} Membership</span>{" "}
                    · {billingInterval === "annually" ? "Annual Billing" : "Monthly Billing"}
                  </p>
                </div>

                {/* Real Stripe Checkout Button */}
                <button
                  type="button"
                  onClick={async () => {
                    if (!user) {
                      toast.error("Please sign in first.");
                      return;
                    }
                    setIsProcessingPayment(true);
                    setPaymentStep("authorizing");
                    try {
                      const basePrice =
                        checkoutPlan === "Elite" ? 99 : checkoutPlan === "Magnate" ? 499 : 1999;
                      const actualPrice =
                        billingInterval === "annually" ? Math.round(basePrice * 0.8) : basePrice;

                      const subRes = await fetch("/api/subscription-session", {
                        method: "POST",
                        headers: { "content-type": "application/json" },
                        body: JSON.stringify({
                          userId: user.id,
                          planName: checkoutPlan,
                          interval: billingInterval,
                          priceUsd: actualPrice,
                        }),
                      });

                      if (subRes.ok) {
                        const resData = await subRes.json();
                        if (resData.hasStripe && resData.url) {
                          toast.success("Redirecting to secured Stripe Gateway...");
                          window.location.href = resData.url;
                          return;
                        } else {
                          toast.error(
                            "Stripe live keys not configured on backend. Please use the sandbox simulator below.",
                          );
                          setPaymentStep("form");
                        }
                      } else {
                        toast.error("Failed to connect to Stripe. Falling back to sandbox.");
                        setPaymentStep("form");
                      }
                    } catch (err) {
                      console.error("Stripe Checkout Error:", err);
                      toast.error(
                        "Stripe gateway timed out. Please use the sandbox simulator below.",
                      );
                      setPaymentStep("form");
                    } finally {
                      setIsProcessingPayment(false);
                    }
                  }}
                  className="w-full gold-gradient text-primary-foreground py-3 rounded-md font-semibold text-sm hover-lift flex items-center justify-center gap-2 shadow-gold-glow"
                >
                  <CreditCard className="h-4 w-4" /> Pay with Secured Stripe Checkout
                </button>

                <div className="flex items-center my-4">
                  <div className="flex-grow border-t border-gold/10"></div>
                  <span className="mx-3 text-[9px] uppercase tracking-widest text-muted-foreground font-semibold">
                    Or use Sandbox Simulator
                  </span>
                  <div className="flex-grow border-t border-gold/10"></div>
                </div>

                <form onSubmit={handleProcessSimulatedPayment} className="space-y-4">
                  <div className="space-y-4">
                    <label className="block">
                      <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                        Cardholder Name
                      </span>
                      <input
                        type="text"
                        required
                        value={cardName}
                        onChange={(e) => setCardName(e.target.value)}
                        placeholder="e.g. Baron Sterling"
                        className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
                      />
                    </label>

                    <label className="block">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Card Number
                        </span>
                        {cardNo && (
                          <span className="text-[9px] uppercase tracking-widest text-gold font-bold">
                            {getCardBrand(cardNo).toUpperCase()}
                          </span>
                        )}
                      </div>
                      <div className="relative">
                        <input
                          type="text"
                          required
                          value={cardNo}
                          maxLength={19}
                          onChange={(e) => {
                            // Format with spaces
                            const val = e.target.value.replace(/\D/g, "");
                            const matches = val.match(/\d{4,16}/g);
                            const match = (matches && matches[0]) || "";
                            const parts = [];
                            for (let i = 0, len = match.length; i < len; i += 4) {
                              parts.push(match.substring(i, i + 4));
                            }
                            if (parts.length > 0) {
                              setCardNo(parts.join(" "));
                            } else {
                              setCardNo(val);
                            }
                          }}
                          placeholder="4242 4242 4242 4242"
                          className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition font-mono"
                        />
                      </div>
                    </label>

                    <div className="grid grid-cols-2 gap-3">
                      <label className="block">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          Exp Date
                        </span>
                        <input
                          type="text"
                          required
                          maxLength={5}
                          placeholder="MM/YY"
                          value={cardExp}
                          onChange={(e) => {
                            let val = e.target.value.replace(/\D/g, "");
                            if (val.length >= 2) {
                              val = `${val.slice(0, 2)}/${val.slice(2, 4)}`;
                            }
                            setCardExp(val);
                          }}
                          className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition font-mono"
                        />
                      </label>

                      <label className="block">
                        <span className="text-[10px] uppercase tracking-widest text-muted-foreground">
                          CVV / Security
                        </span>
                        <input
                          type="password"
                          required
                          maxLength={4}
                          placeholder="123"
                          value={cardCvc}
                          onChange={(e) => setCardCvc(e.target.value.replace(/\D/g, ""))}
                          className="mt-1 w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition font-mono"
                        />
                      </label>
                    </div>
                  </div>

                  <button
                    type="submit"
                    className="w-full mt-4 gold-gradient text-primary-foreground py-3 rounded-md font-semibold text-sm hover-lift flex items-center justify-center gap-2"
                  >
                    Confirm & Secure Upgrade
                  </button>
                </form>
              </div>
            )}

            {paymentStep === "authorizing" && (
              <div className="py-12 text-center space-y-4">
                <Loader2 className="h-10 w-10 animate-spin text-gold mx-auto" />
                <h3 className="font-display text-lg gold-text animate-pulse">
                  Contacting Stripe Gateways...
                </h3>
                <p className="text-xs text-muted-foreground max-w-xs mx-auto">
                  Performing 3D-Secure authentication, tokenizing credit card details and
                  provisioning subscription databases.
                </p>
              </div>
            )}

            {paymentStep === "success" && (
              <div className="py-6 text-center space-y-5 animate-scale-in">
                <div className="grid h-12 w-12 place-items-center rounded-full bg-emerald/10 border border-emerald/30 mx-auto">
                  <CheckCircle2 className="h-6 w-6 text-emerald" />
                </div>
                <div>
                  <h3 className="font-display text-xl text-emerald">Upgrade Successful!</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    You are now a verified{" "}
                    <span className="font-bold text-foreground">{checkoutPlan} Plan</span> holder.
                    Your premium features are fully provisioned and logged.
                  </p>
                </div>
                <button
                  onClick={() => setCheckoutPlan(null)}
                  className="w-full border border-gold/40 text-gold py-2.5 rounded-md text-sm font-semibold hover:gold-gradient hover:text-primary-foreground transition"
                >
                  Return to Console
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ADMIN DASHBOARD TAB */}
      {tab === "admin" && isAdmin && (
        <div className="space-y-6 animate-fade-up">
          <div className="border-b border-gold/10 pb-4">
            <h2 className="font-display text-2xl">Atelier Global Control Center</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Platform administration controls: manage SaaS accounts, update consultation bookings,
              and curate listing catalogs.
            </p>
          </div>

          {/* Admin Metrics */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Global Platform Users",
                value: String(adminProfiles?.length ?? 0),
                d: "Active DB records",
              },
              { label: "SaaS Cumulative Revenue", value: "$489,520", d: "+24% MTD growth" },
              {
                label: "Atelier Listings Audit",
                value: String(adminProducts?.length ?? 0),
                d: "Provenance verified",
              },
              {
                label: "Active Consultations",
                value: String(adminBookings?.filter((b) => b.status === "pending").length ?? 0),
                d: "Awaiting confirmation",
              },
            ].map((m, i) => (
              <div
                key={m.label}
                className="glass rounded-xl p-5 border border-gold/10 shadow-gold-glow animate-fade-up"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <span className="text-[10px] uppercase tracking-widest text-muted-foreground block">
                  {m.label}
                </span>
                <span className="font-display text-2xl gold-text block mt-1">{m.value}</span>
                <span className="text-xs text-emerald block mt-1">{m.d}</span>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-2 gap-6">
            {/* User Directory Management */}
            <div className="glass rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg gold-text flex items-center gap-2">
                <Users className="h-4 w-4" /> User Directory Manager
              </h3>
              <p className="text-xs text-muted-foreground">
                Override roles or memberships. Change levels immediately to simulate subscriber
                accounts.
              </p>

              <div className="divide-y divide-gold/10 space-y-3 max-h-96 overflow-y-auto pr-1">
                {adminProfiles?.map((p) => {
                  const isUserAdmin =
                    p.id === user.id ||
                    p.display_name === "Baron" ||
                    p.display_name === "Gulshan" ||
                    p.role === "admin";
                  return (
                    <div
                      key={p.id}
                      className="flex items-center justify-between py-3 gap-3 animate-fade-up"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground flex items-center gap-1.5">
                          {p.display_name || "Unassigned Member"}{" "}
                          {isUserAdmin && (
                            <span className="text-[9px] bg-gold/10 border border-gold/30 text-gold px-1.5 py-0.5 rounded font-bold">
                              ADMIN
                            </span>
                          )}
                        </div>
                        <div className="text-[10px] text-muted-foreground truncate">{p.id}</div>
                      </div>
                      <div className="flex items-center gap-1.5 shrink-0">
                        <select
                          className="bg-muted text-foreground border border-gold/10 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-gold"
                          defaultValue={p.role || "member"}
                          onChange={async (e) => {
                            const newRole = e.target.value;
                            const { error } = await supabase
                              .from("profiles")
                              .update({ role: newRole })
                              .eq("id", p.id);

                            if (error) {
                              toast.error(`Override failed: ${error.message}`);
                            } else {
                              toast.success(
                                `Role override success: ${p.display_name || "Member"} is now ${newRole.toUpperCase()}`,
                              );
                              refetchAdminProfiles();
                            }
                          }}
                        >
                          <option value="member">Member</option>
                          <option value="vendor">Vendor</option>
                          <option value="admin">Admin</option>
                        </select>
                        <select
                          className="bg-muted text-foreground border border-gold/10 rounded px-2 py-1 text-[10px] focus:outline-none focus:border-gold"
                          defaultValue={p.subscription_tier || "Elite"}
                          onChange={async (e) => {
                            const newTier = e.target.value;
                            const { error } = await supabase
                              .from("profiles")
                              .update({ subscription_tier: newTier })
                              .eq("id", p.id);

                            if (error) {
                              toast.error(`Override failed: ${error.message}`);
                            } else {
                              toast.success(
                                `Membership override success: ${p.display_name || "Member"} allocated to ${newTier.toUpperCase()}`,
                              );
                              refetchAdminProfiles();
                            }
                          }}
                        >
                          <option value="Elite">Elite</option>
                          <option value="Magnate">Magnate</option>
                          <option value="Sovereign">Sovereign</option>
                        </select>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* System Bookings & Consultations */}
            <div className="glass rounded-xl p-6 space-y-4">
              <h3 className="font-display text-lg gold-text flex items-center gap-2">
                <Calendar className="h-4 w-4" /> System Consultation Logs
              </h3>
              <p className="text-xs text-muted-foreground">
                Approve, reject, or complete consultation bookings submitted across the entire
                marketplace.
              </p>

              <div className="divide-y divide-gold/10 space-y-3 max-h-96 overflow-y-auto pr-1">
                {!adminBookings || adminBookings.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground text-xs">
                    No bookings on file in the system.
                  </div>
                ) : (
                  adminBookings.map((b) => (
                    <div
                      key={b.id}
                      className="py-3 flex flex-col sm:flex-row sm:items-center justify-between gap-3 animate-fade-up"
                    >
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-foreground">
                          {new Date(b.scheduled_at).toLocaleString("en-US", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </div>
                        {b.notes && (
                          <div className="text-[10px] text-muted-foreground truncate">
                            {b.notes}
                          </div>
                        )}
                        <div className="text-[9px] text-gold uppercase tracking-wider">
                          Status: {b.status}
                        </div>
                      </div>
                      {b.status === "pending" ? (
                        <div className="flex items-center gap-2 shrink-0">
                          <button
                            onClick={() => handleUpdateBooking(b.id, "confirmed")}
                            className="bg-emerald/15 border border-emerald/35 text-emerald text-[9px] uppercase px-2 py-1 rounded font-bold hover:bg-emerald/25"
                          >
                            Approve
                          </button>
                          <button
                            onClick={() => handleUpdateBooking(b.id, "rejected")}
                            className="bg-red-500/10 border border-red-500/30 text-red-400 text-[9px] uppercase px-2 py-1 rounded font-bold hover:bg-red-500/20"
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="text-[10px] uppercase text-muted-foreground">Closed</span>
                      )}
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* Catalog Curation Panel */}
          <div className="glass rounded-xl p-6 space-y-4">
            <h3 className="font-display text-lg gold-text flex items-center gap-2">
              <Package className="h-4 w-4" /> Product Catalog & Curation Gateway
            </h3>
            <p className="text-xs text-muted-foreground">
              Audit the existing collection. Toggle featured status for homepage allocation or
              remove listings.
            </p>

            <div className="divide-y divide-gold/10 space-y-3 max-h-96 overflow-y-auto pr-1">
              {adminProducts?.map((p) => (
                <div
                  key={p.id}
                  className="py-3 flex items-center justify-between gap-4 animate-fade-up"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="h-12 w-12 rounded bg-muted/50 overflow-hidden shrink-0">
                      {p.image_url && (
                        <img
                          src={p.image_url}
                          alt={p.name}
                          className="h-full w-full object-cover"
                          referrerPolicy="no-referrer"
                        />
                      )}
                    </div>
                    <div className="min-w-0">
                      <div className="text-xs font-semibold text-foreground truncate">{p.name}</div>
                      <div className="text-[10px] text-muted-foreground">
                        {p.category} · Price: {fmt(p.price_cents)} · Stock: {p.stock}
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => handleToggleFeatureProduct(p.id, p.featured)}
                      className={`text-[10px] uppercase font-bold px-2.5 py-1 rounded border transition ${
                        p.featured
                          ? "bg-gold/15 border-gold/40 text-gold"
                          : "bg-muted border-gold/5 text-muted-foreground hover:border-gold/20"
                      }`}
                    >
                      <Star className="h-3 w-3 inline mr-1" /> Featured
                    </button>
                    <button
                      onClick={() => handleDeleteProduct(p.id)}
                      className="text-red-400 hover:text-red-300 transition"
                      aria-label="Delete piece"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* SETTINGS TAB */}
      {tab === "settings" && (
        <div className="max-w-2xl mx-auto glass rounded-xl p-6 sm:p-8 animate-fade-up">
          <div className="mb-6">
            <h2 className="font-display text-2xl">Profile Settings</h2>
            <p className="text-muted-foreground text-sm mt-1">
              Customize your private credentials and premium member card presentation.
            </p>
          </div>

          <form onSubmit={handleSaveProfile} className="space-y-6">
            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Secure Email Address
              </label>
              <input
                type="email"
                disabled
                value={user?.email || ""}
                className="w-full bg-muted/20 text-muted-foreground/60 rounded-md px-3 py-2 text-sm border border-gold/5 outline-none cursor-not-allowed"
              />
              <span className="text-[11px] text-muted-foreground/50 mt-1 block">
                Contact luxury support to coordinate email changes.
              </span>
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Display Name / Moniker
              </label>
              <input
                type="text"
                required
                value={profileDisplayName}
                onChange={(e) => setProfileDisplayName(e.target.value)}
                placeholder="e.g. Baron Sterling"
                className="w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
              />
            </div>

            <div>
              <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                Avatar Image URL
              </label>
              <input
                type="text"
                value={profileAvatarUrl}
                onChange={(e) => setProfileAvatarUrl(e.target.value)}
                placeholder="e.g. HTTPS link or avatar image URL"
                className="w-full bg-muted/40 text-foreground rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none transition"
              />
              <span className="text-[11px] text-muted-foreground/50 mt-1 block">
                Provide a secure web address containing your digital portrait.
              </span>
            </div>

            <button
              type="submit"
              disabled={updatingProfile}
              className="w-full gold-gradient text-primary-foreground py-3 rounded-md font-medium text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 hover-lift"
            >
              {updatingProfile ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" /> Persisting adjustments...
                </>
              ) : (
                "Save adjustments"
              )}
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
