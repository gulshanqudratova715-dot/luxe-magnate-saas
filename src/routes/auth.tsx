import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Membership · LUXE MAGNATE" },
      { name: "description", content: "Sign in or request membership to LUXE MAGNATE." },
    ],
  }),
  component: Auth,
});

function Auth() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: { emailRedirectTo: `${window.location.origin}/` },
        });
        if (error) throw error;
        toast.success("Welcome to LUXE MAGNATE", { description: "Check your email to confirm." });
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success("Welcome back");
        navigate({ to: "/dashboard" });
      }
    } catch (err) {
      toast.error((err as Error).message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-6 py-12">
      <div className="w-full max-w-md glass rounded-2xl p-8 sm:p-10 shadow-luxe animate-fade-up">
        <div className="grid h-12 w-12 place-items-center rounded-lg gold-gradient mx-auto mb-6 shadow-gold-glow">
          <Sparkles className="h-5 w-5 text-primary-foreground" />
        </div>
        <h1 className="font-display text-3xl text-center gold-text">
          {mode === "signin" ? "Welcome back" : "Request access"}
        </h1>
        <p className="text-sm text-muted-foreground text-center mt-2 mb-8">
          {mode === "signin" ? "Sign in to your membership." : "Create your LUXE MAGNATE account."}
        </p>

        <form onSubmit={submit} className="space-y-4">
          <label className="block">
            <span className="text-xs text-muted-foreground">Email</span>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full bg-muted/50 rounded-md px-3 py-2.5 text-sm border border-transparent focus:border-gold/40 outline-none"
            />
          </label>
          <label className="block">
            <span className="text-xs text-muted-foreground">Password</span>
            <input
              type="password"
              required
              minLength={8}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 w-full bg-muted/50 rounded-md px-3 py-2.5 text-sm border border-transparent focus:border-gold/40 outline-none"
            />
          </label>
          <button
            type="submit"
            disabled={loading}
            className="w-full gold-gradient text-primary-foreground py-3 rounded-md font-medium disabled:opacity-60 hover-lift"
          >
            {loading ? "Please wait…" : mode === "signin" ? "Sign in" : "Create account"}
          </button>
        </form>

        <button
          onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
          className="w-full mt-6 text-sm text-muted-foreground hover:text-gold transition"
        >
          {mode === "signin" ? "New here? Request access" : "Already a member? Sign in"}
        </button>
      </div>
    </div>
  );
}
