import { useMemo, useState } from "react";
import { LineChart, Line, ResponsiveContainer, XAxis, YAxis, Tooltip } from "recharts";

const fmt = (n: number) =>
  n.toLocaleString("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 });

export function FinancialCalculator() {
  const [principal, setPrincipal] = useState(150000);
  const [years, setYears] = useState(5);
  const [rate, setRate] = useState(4.5);

  const { monthly, totalInterest, totalPaid, schedule } = useMemo(() => {
    const n = years * 12;
    const r = rate / 100 / 12;
    const m = r === 0 ? principal / n : (principal * r) / (1 - Math.pow(1 + r, -n));
    const paid = m * n;
    const interest = paid - principal;
    const points = Array.from({ length: years + 1 }, (_, i) => {
      const months = i * 12;
      const balance =
        r === 0
          ? principal - (principal / n) * months
          : principal * Math.pow(1 + r, months) - m * ((Math.pow(1 + r, months) - 1) / r);
      return { year: i, balance: Math.max(0, balance) };
    });
    return { monthly: m, totalInterest: interest, totalPaid: paid, schedule: points };
  }, [principal, years, rate]);

  return (
    <div className="glass rounded-2xl p-6 sm:p-8 shadow-luxe animate-fade-up">
      <div className="grid gap-5">
        <Field label="Principal" value={fmt(principal)}>
          <input
            type="range"
            min={10000}
            max={2000000}
            step={5000}
            value={principal}
            onChange={(e) => setPrincipal(+e.target.value)}
            className="w-full accent-[color:var(--gold)]"
          />
        </Field>
        <div className="grid grid-cols-2 gap-5">
          <Field label="Term" value={`${years} yrs`}>
            <input
              type="range"
              min={1}
              max={30}
              step={1}
              value={years}
              onChange={(e) => setYears(+e.target.value)}
              className="w-full accent-[color:var(--gold)]"
            />
          </Field>
          <Field label="Rate" value={`${rate.toFixed(2)}%`}>
            <input
              type="range"
              min={0}
              max={15}
              step={0.1}
              value={rate}
              onChange={(e) => setRate(+e.target.value)}
              className="w-full accent-[color:var(--gold)]"
            />
          </Field>
        </div>

        <div className="h-40 -mx-2">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={schedule} margin={{ top: 8, right: 8, left: 8, bottom: 0 }}>
              <defs>
                <linearGradient id="g" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="oklch(0.88 0.14 90)" />
                  <stop offset="100%" stopColor="oklch(0.55 0.14 160)" />
                </linearGradient>
              </defs>
              <XAxis
                dataKey="year"
                stroke="oklch(0.6 0.02 80)"
                fontSize={11}
                tickLine={false}
                axisLine={false}
              />
              <YAxis hide domain={[0, "auto"]} />
              <Tooltip
                contentStyle={{
                  background: "oklch(0.18 0.012 60)",
                  border: "1px solid oklch(0.82 0.13 85 / 0.3)",
                  borderRadius: 8,
                  fontSize: 12,
                }}
                formatter={(v) => fmt(Number(v))}
                labelFormatter={(y) => `Year ${y}`}
              />
              <Line
                type="monotone"
                dataKey="balance"
                stroke="url(#g)"
                strokeWidth={2.5}
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-3 gap-3 pt-4 border-t border-gold/10">
          <Stat label="Monthly" value={fmt(monthly)} accent />
          <Stat label="Interest" value={fmt(totalInterest)} />
          <Stat label="Total" value={fmt(totalPaid)} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label,
  value,
  children,
}: {
  label: string;
  value: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between mb-2">
        <span className="text-xs uppercase tracking-widest text-muted-foreground">{label}</span>
        <span className="font-display gold-text">{value}</span>
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value, accent }: { label: string; value: string; accent?: boolean }) {
  return (
    <div>
      <div className="text-[10px] uppercase tracking-widest text-muted-foreground">{label}</div>
      <div className={`font-display text-lg mt-1 ${accent ? "gold-text" : ""}`}>{value}</div>
    </div>
  );
}
