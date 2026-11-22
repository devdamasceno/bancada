import { after } from "next/server";
import { notificarSitePublicado } from "@/lib/automacao";
import { obterEstadoPedido, reservarAvisoSite } from "@/lib/db";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * A sessão que gera o site grava o andamento direto no banco (site_status, site_url, dominio_status)
 * e depois chama aqui com { conversaId }. Não precisa de senha: este endpoint só lê o banco
 * e manda o e-mail de "site no ar" uma única vez, se o pedido estiver pago e publicado.
 */
export async function POST(request: Request) {
  const c = (await request.json().catch(() => null)) as { conversaId?: unknown } | null;
  const id = typeof c?.conversaId === "string" ? c.conversaId : "";
  if (!UUID.test(id)) return Response.json({ erro: "id" }, { status: 400 });

  const p = await obterEstadoPedido(id);
  if (!p || p.pagamentoStatus !== "aprovado") return Response.json({ erro: "nao_encontrado" }, { status: 404 });
  if (p.siteStatus !== "publicado" || !p.siteUrl) return Response.json({ ok: true, aviso: "aguardando_publicacao" });

  if (await reservarAvisoSite(id)) {
    const base = process.env.SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    after(() => notificarSitePublicado(id, base));
    return Response.json({ ok: true, aviso: "enviado" });
  }
  return Response.json({ ok: true, aviso: "ja_enviado" });
}
