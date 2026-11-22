import { timingSafeEqual } from "node:crypto";
import { after } from "next/server";
import { notificarSitePublicado } from "@/lib/automacao";
import { atualizarSite, obterEstadoPedido } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const STATUS = new Set(["gerando", "publicado", "erro"]);
const DOMINIO = new Set(["livre", "ocupado", "do_cliente", "apontado", "indefinido"]);

function autorizado(request: Request) {
  const segredo = process.env.KRIAI_AUTOMACAO_SEGREDO;
  const enviado = request.headers.get("authorization")?.replace(/^Bearer\s+/i, "") ?? "";
  if (!segredo || !enviado) return false;
  const a = Buffer.from(segredo);
  const b = Buffer.from(enviado);
  return a.length === b.length && timingSafeEqual(a, b);
}

/**
 * A sessão que gera o site avisa o andamento aqui (Authorization: Bearer KRIAI_AUTOMACAO_SEGREDO).
 * Corpo: { conversaId, status: "gerando" | "publicado" | "erro", url?, obs?, dominioStatus? }
 */
export async function POST(request: Request) {
  if (!autorizado(request)) return Response.json({ erro: "nao_autorizado" }, { status: 401 });
  const c = (await request.json().catch(() => null)) as Record<string, unknown> | null;
  const id = typeof c?.conversaId === "string" ? c.conversaId : "";
  const status = typeof c?.status === "string" ? c.status : "";
  if (!UUID.test(id) || !STATUS.has(status)) return Response.json({ erro: "entrada" }, { status: 400 });

  let url: string | undefined;
  if (typeof c?.url === "string") {
    try {
      const u = new URL(c.url);
      if (u.protocol !== "https:") throw new Error();
      url = u.toString().replace(/\/$/, "");
    } catch {
      return Response.json({ erro: "url" }, { status: 400 });
    }
  }
  if (status === "publicado" && !url) return Response.json({ erro: "url" }, { status: 400 });
  const dominioStatus = typeof c?.dominioStatus === "string" && DOMINIO.has(c.dominioStatus) ? c.dominioStatus : undefined;

  const antes = await obterEstadoPedido(id);
  if (!antes) return Response.json({ erro: "nao_encontrado" }, { status: 404 });
  if (antes.pagamentoStatus !== "aprovado") return Response.json({ erro: "nao_pago" }, { status: 409 });

  await atualizarSite(id, {
    status: status as "gerando" | "publicado" | "erro",
    url,
    obs: typeof c?.obs === "string" ? c.obs : undefined,
    dominioStatus,
  });
  if (status === "publicado" && antes.siteStatus !== "publicado") {
    const base = process.env.SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    after(() => notificarSitePublicado(id, base));
  }
  return Response.json({ ok: true });
}
