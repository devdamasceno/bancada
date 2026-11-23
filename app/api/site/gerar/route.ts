import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { gerarEAvisar } from "@/lib/geracao";

// A geração do site leva alguns minutos: esta função tem o tempo máximo.
export const maxDuration = 300;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function autorizado(request: Request) {
  const segredo = process.env.KRIAI_AUTOMACAO_SEGREDO;
  const enviado = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!segredo || !enviado) return false;
  const a = Buffer.from(segredo);
  const b = Buffer.from(enviado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Chamado pelo próprio site quando o pagamento é aprovado. Responde na hora e gera em seguida. */
export async function POST(request: Request) {
  if (!autorizado(request)) return Response.json({ erro: "nao_autorizado" }, { status: 401 });
  const c = (await request.json().catch(() => null)) as { conversaId?: unknown } | null;
  const id = typeof c?.conversaId === "string" ? c.conversaId : "";
  if (!UUID.test(id)) return Response.json({ erro: "id" }, { status: 400 });
  const base = process.env.SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
  after(async () => {
    try {
      await gerarEAvisar(id, base);
    } catch (err) {
      console.error("[site gerar]", id, err);
    }
  });
  return Response.json({ ok: true }, { status: 202 });
}
