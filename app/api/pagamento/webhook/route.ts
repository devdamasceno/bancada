import { after } from "next/server";
import { marcarPagamento, marcarPago, obterEstadoPedido } from "@/lib/db";
import { assinaturaValida, consultarPagamento } from "@/lib/mercadopago";
import { iniciarGeracao, notificarPagamento } from "@/lib/automacao";

export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Aviso do Mercado Pago (Webhooks). Ele só diz "o pagamento X mudou":
 * conferimos a assinatura, consultamos o pagamento na API e só então mexemos no pedido.
 * Responde 200 rápido; se responder erro, o Mercado Pago tenta de novo mais tarde.
 */
export async function POST(request: Request) {
  const url = new URL(request.url);
  const corpo = (await request.json().catch(() => ({}))) as { type?: string; data?: { id?: string | number } };
  const tipo = url.searchParams.get("type") ?? corpo.type ?? url.searchParams.get("topic");
  const dataId = url.searchParams.get("data.id") ?? (corpo.data?.id != null ? String(corpo.data.id) : null);

  if (tipo !== "payment" || !dataId) return new Response(null, { status: 200 }); // outros eventos: ignorados
  if (!assinaturaValida(request.headers.get("x-signature"), request.headers.get("x-request-id"), dataId)) {
    console.warn("[webhook mp] assinatura inválida", dataId);
    return new Response(null, { status: 401 });
  }

  try {
    const pg = await consultarPagamento(dataId);
    const id = pg.referencia;
    if (!id || !UUID.test(id)) return new Response(null, { status: 200 });
    const pedido = await obterEstadoPedido(id);
    if (!pedido) return new Response(null, { status: 200 });

    if (pg.status === "approved") {
      if (pg.moeda !== "BRL" || pedido.valorCobrado == null || pg.valor + 0.009 < pedido.valorCobrado) {
        console.error("[webhook mp] valor diferente do cobrado", id, pg.valor, pedido.valorCobrado);
        return new Response(null, { status: 200 });
      }
      const primeiraVez = await marcarPago(id, pg.id);
      if (primeiraVez) {
        const base = process.env.SITE_URL?.replace(/\/$/, "") || url.origin;
        after(async () => {
          await iniciarGeracao(id, base);
          await notificarPagamento(id, base);
        });
      }
    } else if (pg.status === "rejected" || pg.status === "cancelled") {
      await marcarPagamento(id, "recusado", pg.id);
    } else if (pg.status === "refunded" || pg.status === "charged_back") {
      await marcarPagamento(id, "estornado", pg.id);
    }
    return new Response(null, { status: 200 });
  } catch (err) {
    console.error("[webhook mp]", dataId, err);
    return new Response(null, { status: 500 }); // o Mercado Pago reenvia
  }
}
