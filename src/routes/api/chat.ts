import { createFileRoute } from "@tanstack/react-router";

const SYSTEM = `You are the LUXE MAGNATE Concierge — an elite, warm, and precise AI advisor for a private luxury marketplace and AI automation atelier.
Voice: refined, confident, concise. Never verbose. Use American English.
You may discuss: curated luxury products (horology, spirits, leather, rare goods), AI automation packages (starting at $12,000/mo), private consultations, financing (from 3.9% APR), global white-glove shipping, and vendor onboarding.
When appropriate, invite the guest to explore the marketplace, book a consultation, or continue to checkout.
Never invent order numbers or personal data. Keep replies under 120 words.`;

type IncomingMessage = { role: "user" | "assistant" | "system"; content: string };

export const Route = createFileRoute("/api/chat")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const key = process.env.LOVABLE_API_KEY;
        if (!key) return new Response("Missing LOVABLE_API_KEY", { status: 500 });

        const body = (await request.json()) as { messages?: IncomingMessage[] };
        const history = Array.isArray(body.messages) ? body.messages.slice(-16) : [];

        const upstream = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: {
            "content-type": "application/json",
            "Lovable-API-Key": key,
          },
          body: JSON.stringify({
            model: "google/gemini-3-flash-preview",
            stream: true,
            messages: [{ role: "system", content: SYSTEM }, ...history],
          }),
        });

        if (!upstream.ok || !upstream.body) {
          const txt = await upstream.text().catch(() => "");
          return new Response(txt || "Upstream error", { status: upstream.status });
        }

        const encoder = new TextEncoder();
        const decoder = new TextDecoder();
        const stream = new ReadableStream({
          async start(controller) {
            const reader = upstream.body!.getReader();
            let buf = "";
            try {
              while (true) {
                const { done, value } = await reader.read();
                if (done) break;
                buf += decoder.decode(value, { stream: true });
                const lines = buf.split("\n");
                buf = lines.pop() ?? "";
                for (const line of lines) {
                  const s = line.trim();
                  if (!s.startsWith("data:")) continue;
                  const payload = s.slice(5).trim();
                  if (payload === "[DONE]") {
                    controller.close();
                    return;
                  }
                  try {
                    const json = JSON.parse(payload);
                    const delta = json.choices?.[0]?.delta?.content;
                    if (delta) controller.enqueue(encoder.encode(delta));
                  } catch {
                    /* ignore parse */
                  }
                }
              }
              controller.close();
            } catch (err) {
              controller.error(err);
            }
          },
        });

        return new Response(stream, {
          headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" },
        });
      },
    },
  },
});
