import Anthropic from "@anthropic-ai/sdk";
import { NextResponse } from "next/server";
import { z } from "zod";
import { createClient } from "@/lib/supabase/server";
import { runAssistant } from "@/lib/assistant";

const bodySchema = z.object({
  messages: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().trim().min(1).max(2000) }))
    .min(1)
    .max(40),
});

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const parsed = bodySchema.safeParse(await request.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });

  // Mantém só as últimas 20 mensagens e garante que a conversa começa pelo usuário.
  let history = parsed.data.messages.slice(-20);
  while (history.length && history[0].role !== "user") history = history.slice(1);
  if (history.at(-1)?.role !== "user") return NextResponse.json({ error: "Mensagem inválida" }, { status: 400 });

  try {
    const reply = await runAssistant(supabase, history);
    return NextResponse.json({ reply });
  } catch (error) {
    if (error instanceof Anthropic.RateLimitError) {
      return NextResponse.json({ error: "Muitas perguntas seguidas. Aguarde alguns segundos." }, { status: 429 });
    }
    if (error instanceof Anthropic.AuthenticationError) {
      console.error("[assistente] chave da Anthropic inválida");
      return NextResponse.json({ error: "Assistente indisponível no momento." }, { status: 503 });
    }
    if (error instanceof Anthropic.APIError) {
      console.error(`[assistente] erro da API ${error.status}:`, error.message);
      return NextResponse.json({ error: "Assistente indisponível no momento." }, { status: 502 });
    }
    console.error("[assistente]", error);
    return NextResponse.json({ error: "Não consegui consultar seus dados agora." }, { status: 500 });
  }
}
