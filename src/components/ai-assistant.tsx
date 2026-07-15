import { useEffect, useRef, useState } from "react";
import { MessageSquare, X, Send, Sparkles } from "lucide-react";
import { toast } from "sonner";

type Msg = { role: "user" | "assistant"; content: string };

const SEED: Msg[] = [
  {
    role: "assistant",
    content:
      "Welcome to LUXE MAGNATE. I'm your AI concierge — ask about curated pieces, financing, automation packages, or private consultations.",
  },
];

export function AiAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState<Msg[]>(SEED);
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages, open]);

  const send = async () => {
    const text = input.trim();
    if (!text || streaming) return;
    setInput("");
    const next: Msg[] = [...messages, { role: "user", content: text }];
    setMessages([...next, { role: "assistant", content: "" }]);
    setStreaming(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ messages: next }),
      });
      if (res.status === 429) throw new Error("Rate limit — please try again in a moment.");
      if (res.status === 402) throw new Error("AI credits exhausted. Please contact the atelier.");
      if (!res.ok || !res.body) throw new Error("The concierge is momentarily unavailable.");
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let acc = "";
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        acc += decoder.decode(value, { stream: true });
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = { role: "assistant", content: acc };
          return copy;
        });
      }
      if (!acc) {
        setMessages((m) => {
          const copy = [...m];
          copy[copy.length - 1] = {
            role: "assistant",
            content: "I'm here — could you rephrase that?",
          };
          return copy;
        });
      }
    } catch (e) {
      const msg = e instanceof Error ? e.message : "Something went wrong.";
      toast.error(msg);
      setMessages((m) => m.slice(0, -1));
    } finally {
      setStreaming(false);
    }
  };

  return (
    <>
      <button
        onClick={() => setOpen((v) => !v)}
        aria-label="Open AI concierge"
        className="fixed bottom-5 right-5 z-50 grid h-14 w-14 place-items-center rounded-full gold-gradient text-primary-foreground shadow-luxe animate-glow hover:scale-105 transition-transform"
      >
        {open ? <X className="h-5 w-5" /> : <MessageSquare className="h-5 w-5" />}
      </button>

      <div
        className={`fixed bottom-24 right-5 z-50 w-[min(380px,calc(100vw-2.5rem))] h-[min(560px,calc(100vh-8rem))] glass rounded-2xl shadow-luxe flex flex-col overflow-hidden transition-all duration-500 ${
          open
            ? "opacity-100 translate-y-0 pointer-events-auto"
            : "opacity-0 translate-y-4 pointer-events-none"
        }`}
      >
        <div className="px-5 py-4 border-b border-gold/15 flex items-center gap-3">
          <div className="grid h-9 w-9 place-items-center rounded-full gold-gradient">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="min-w-0">
            <div className="font-display text-sm gold-text">LUXE Concierge</div>
            <div className="text-[11px] text-muted-foreground flex items-center gap-1.5">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald animate-pulse" />
              {streaming ? "Streaming reply…" : "Online · AI-powered"}
            </div>
          </div>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.map((m, i) => (
            <div
              key={i}
              className={`flex ${m.role === "user" ? "justify-end" : "justify-start"} animate-fade-up`}
            >
              <div
                className={`max-w-[85%] px-3.5 py-2.5 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  m.role === "user"
                    ? "gold-gradient text-primary-foreground rounded-br-sm"
                    : "bg-muted/70 text-foreground rounded-bl-sm border border-gold/10"
                }`}
              >
                {m.content || (streaming && i === messages.length - 1 ? "…" : "")}
                {streaming && i === messages.length - 1 && m.role === "assistant" && m.content && (
                  <span className="inline-block w-1 h-3 ml-0.5 bg-gold animate-pulse align-middle" />
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="p-3 border-t border-gold/15 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && send()}
            placeholder="Ask the concierge…"
            className="flex-1 bg-muted/60 rounded-full px-4 py-2.5 text-sm outline-none border border-transparent focus:border-gold/40 transition"
          />
          <button
            onClick={send}
            disabled={streaming || !input.trim()}
            className="grid h-10 w-10 place-items-center rounded-full gold-gradient text-primary-foreground disabled:opacity-40 hover:scale-105 transition-transform"
            aria-label="Send"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </>
  );
}
