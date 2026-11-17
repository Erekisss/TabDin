import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createConnectToken, pluggyEnabled } from "@/lib/openfinance";

export async function POST(request: Request) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: "Não autenticado" }, { status: 401 });
  if (!pluggyEnabled()) {
    return NextResponse.json({ error: "Pluggy não configurado" }, { status: 501 });
  }

  const body = (await request.json().catch(() => ({}))) as { itemId?: string };
  try {
    const accessToken = await createConnectToken(user.id, body.itemId);
    return NextResponse.json({ accessToken });
  } catch (e) {
    return NextResponse.json({ error: (e as Error).message }, { status: 502 });
  }
}
