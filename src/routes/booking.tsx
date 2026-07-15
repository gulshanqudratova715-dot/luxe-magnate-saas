import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useEffect, useMemo, useState } from "react";
import { Calendar, Clock, Check, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import type { User } from "@supabase/supabase-js";

export const Route = createFileRoute("/booking")({
  head: () => ({
    meta: [
      { title: "Private Consultation · LUXE MAGNATE" },
      {
        name: "description",
        content: "Reserve a private consultation with a LUXE MAGNATE specialist.",
      },
    ],
  }),
  component: Booking,
});

const slots = ["09:00", "10:30", "12:00", "14:00", "15:30", "17:00"];

function Booking() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [loadingUser, setLoadingUser] = useState(true);
  const [month, setMonth] = useState(new Date());
  const [selected, setSelected] = useState<Date | null>(null);
  const [slot, setSlot] = useState<string | null>(null);
  const [notes, setNotes] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setUser(data.user ?? null);
      setLoadingUser(false);
    });
  }, []);

  const days = useMemo(() => {
    const y = month.getFullYear();
    const m = month.getMonth();
    const first = new Date(y, m, 1);
    const startDay = first.getDay();
    const daysInMonth = new Date(y, m + 1, 0).getDate();
    const cells: (Date | null)[] = [];
    for (let i = 0; i < startDay; i++) cells.push(null);
    for (let d = 1; d <= daysInMonth; d++) cells.push(new Date(y, m, d));
    return cells;
  }, [month]);

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const confirm = async () => {
    if (!selected || !slot) return;
    if (!user) {
      toast.error("Please sign in to schedule a consultation.");
      navigate({ to: "/auth" });
      return;
    }

    setSaving(true);
    try {
      const [hours, minutes] = slot.split(":");
      const scheduledDate = new Date(selected);
      scheduledDate.setHours(parseInt(hours), parseInt(minutes), 0, 0);

      const { error } = await supabase.from("bookings").insert({
        user_id: user.id,
        scheduled_at: scheduledDate.toISOString(),
        notes: notes.trim() || "Acquisition consultation",
        status: "confirmed",
      });

      if (error) throw error;

      setConfirmed(true);
      toast.success("Consultation reserved", {
        description: `${selected.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" })} at ${slot}`,
      });
      setTimeout(() => {
        navigate({ to: "/dashboard" });
      }, 1500);
    } catch (err) {
      console.error(err);
      toast.error((err as Error).message || "Failed to reserve consultation. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loadingUser) {
    return (
      <div className="mx-auto max-w-6xl px-6 py-24 text-center">
        <Loader2 className="h-8 w-8 animate-spin text-gold mx-auto mb-4" />
        <p className="text-sm text-muted-foreground">Verifying secure connection…</p>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center animate-fade-up">
        <div className="grid h-14 w-14 mx-auto place-items-center rounded-full gold-gradient shadow-gold-glow mb-6">
          <Calendar className="h-6 w-6 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl">Private Scheduling Access</h1>
        <p className="text-muted-foreground mt-3">
          Specialist consultation requests are reserved exclusively for registered members. Please
          sign in or request access.
        </p>
        <Link
          to="/auth"
          className="mt-8 inline-block gold-gradient text-primary-foreground px-7 py-3 rounded-md font-medium hover-lift"
        >
          Sign in / Register
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-6xl px-6 sm:px-8 py-12 sm:py-16">
      <div className="mb-10 animate-fade-up text-center">
        <div className="text-xs uppercase tracking-[0.25em] text-gold mb-3">Concierge</div>
        <h1 className="font-display text-4xl sm:text-5xl">Reserve a private consultation</h1>
        <p className="text-muted-foreground mt-3 max-w-lg mx-auto">
          Meet with a LUXE MAGNATE specialist to curate acquisitions, financing, or automation.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="glass rounded-2xl p-6 sm:p-8 animate-fade-up">
          <div className="flex items-center justify-between mb-6">
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() - 1, 1))}
              className="text-gold text-sm hover:opacity-70"
            >
              ← Prev
            </button>
            <div className="font-display text-xl gold-text">
              {month.toLocaleDateString("en-US", { month: "long", year: "numeric" })}
            </div>
            <button
              onClick={() => setMonth(new Date(month.getFullYear(), month.getMonth() + 1, 1))}
              className="text-gold text-sm hover:opacity-70"
            >
              Next →
            </button>
          </div>
          <div className="grid grid-cols-7 gap-1 text-center text-[10px] uppercase tracking-widest text-muted-foreground mb-2">
            {["S", "M", "T", "W", "T", "F", "S"].map((d, i) => (
              <div key={i}>{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {days.map((d, i) => {
              if (!d) return <div key={i} />;
              const past = d < today;
              const isSel = selected?.toDateString() === d.toDateString();
              return (
                <button
                  key={i}
                  disabled={past}
                  onClick={() => {
                    setSelected(d);
                    setSlot(null);
                    setConfirmed(false);
                  }}
                  className={`aspect-square rounded-md text-sm transition ${
                    past
                      ? "text-muted-foreground/40 cursor-not-allowed"
                      : isSel
                        ? "gold-gradient text-primary-foreground font-medium shadow-gold-glow"
                        : "hover:bg-muted text-foreground"
                  }`}
                >
                  {d.getDate()}
                </button>
              );
            })}
          </div>
        </div>

        <div
          className="glass rounded-2xl p-6 sm:p-8 animate-fade-up"
          style={{ animationDelay: "100ms" }}
        >
          <div className="flex items-center gap-2 text-xs uppercase tracking-widest text-gold mb-4">
            <Clock className="h-3.5 w-3.5" /> Available slots
          </div>
          {!selected ? (
            <div className="text-sm text-muted-foreground py-10 text-center">
              Select a date to view times.
            </div>
          ) : (
            <>
              <div className="font-display text-lg mb-4">
                {selected.toLocaleDateString("en-US", {
                  weekday: "long",
                  month: "long",
                  day: "numeric",
                })}
              </div>
              <div className="grid grid-cols-3 gap-2 mb-6">
                {slots.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSlot(s)}
                    className={`py-2.5 rounded-md text-sm transition ${
                      slot === s
                        ? "gold-gradient text-primary-foreground font-medium"
                        : "border border-gold/20 text-foreground hover:border-gold/50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
              <div className="mb-6">
                <label className="block text-xs uppercase tracking-widest text-muted-foreground mb-2">
                  Consultation Notes (Optional)
                </label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Tell us what you would like to discuss (e.g., bespoke timepieces, luxury asset financing, or enterprise automation packages)..."
                  className="w-full bg-muted/40 rounded-md px-3 py-2 text-sm border border-gold/10 focus:border-gold/40 outline-none resize-none h-24 text-foreground placeholder:text-muted-foreground/50 transition-colors"
                />
              </div>

              <button
                disabled={!slot || confirmed || saving}
                onClick={confirm}
                className="w-full gold-gradient text-primary-foreground py-3 rounded-md font-medium inline-flex items-center justify-center gap-2 disabled:opacity-40 hover-lift"
              >
                {saving ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Reserving...
                  </>
                ) : confirmed ? (
                  <>
                    <Check className="h-4 w-4" /> Reserved
                  </>
                ) : (
                  <>
                    <Calendar className="h-4 w-4" /> Confirm reservation
                  </>
                )}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
