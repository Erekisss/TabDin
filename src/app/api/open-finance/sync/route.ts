import { NextResponse } from "next/server";
import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { buildDemoItem, fetchPluggyItem, persistItem, pluggyEnabled } from "@/lib/openfinance";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });

  const body = (await request.json().catch(() => ({}))) as { itemId?: string; demo?: boolean };

  try {
    let result;
    if (body.demo) {
      result = await persistItem(supabase, "demo", buildDemoItem(user.id));
    } else {
      if (!pluggyEnabled()) {
        return NextResponse.json({ error: "Pluggy não configurado" }, { status: 501 });
      }
      if (!body.itemId || !/^[\w-]{8,64}$/.test(body.itemId)) {
        return NextResponse.json({ error: "itemId inválido" }, { status: 400 });
      }
      result = await persistItem(supabase, "pluggy", await fetchPluggyItem(body.itemId, user.id));
    }
    revalidatePath("/", "layout");
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    console.error("[open-finance/sync]", e);
    return NextResponse.json({ error: "Falha ao sincronizar com o banco" }, { status: 502 });
  }
}
