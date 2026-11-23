import { after } from "next/server";
import { obterConversa } from "@/lib/db";
import { fecharPedido } from "@/lib/fechamento";
import { prontaParaEnviar } from "@/lib/ficha";
import { processarPedidoEnviado } from "@/lib/notificacao";

// Dá tempo para a avaliação da IA e o e-mail, que rodam depois da resposta ao cliente.
export const maxDuration = 60;

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Confirma o pedido pelo botão "Enviar pedido" da ficha. Site de 1 página sai com o link de pagamento. */
export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "corpo" }, { status: 400 });
  }
  const id = typeof corpo.conversaId === "string" ? corpo.conversaId : "";
  if (!UUID.test(id)) return Response.json({ erro: "id" }, { status: 400 });

  try {
    const salvo = await obterConversa(id);
    if (!salvo) return Response.json({ erro: "nao_encontrada" }, { status: 404 });
    if (!prontaParaEnviar(salvo.conversa.ficha)) return Response.json({ erro: "incompleta" }, { status: 422 });
    const jaEnviado = salvo.conversa.status === "enviado";

    const base = process.env.SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;
    let f;
    try {
      f = await fecharPedido(id, base, corpo.novidades === true);
    } catch (err) {
      // Mercado Pago fora do ar: o pedido já foi confirmado e segue pelo caminho normal
      console.error("[pedido] cobrança", id, err);
      const de = await obterConversa(id);
      f = { numero: de?.conversa.numero ?? null, link: null, acompanhar: null };
    }
    if (!f?.numero) return Response.json({ erro: "servidor" }, { status: 500 });

    // Depois de responder ao cliente: avalia o lead e avisa você por e-mail (só na primeira vez).
    if (!jaEnviado) after(() => processarPedidoEnviado(id, base));
    return Response.json({ numero: f.numero, pagamento: f.link, acompanhar: f.link ? f.acompanhar : null });
  } catch (err) {
    console.error("[pedido]", err);
    return Response.json({ erro: "servidor" }, { status: 500 });
  }
}
