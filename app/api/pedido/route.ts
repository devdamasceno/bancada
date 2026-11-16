import { consentimento } from "@/content/site";
import { confirmarPedido, obterConversa } from "@/lib/db";
import { prontaParaEnviar } from "@/lib/ficha";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Confirma o pedido. A conversa e a ficha já estão salvas como rascunho; aqui ela passa a "enviado". */
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
    if (salvo.conversa.status === "enviado") return Response.json({ numero: salvo.conversa.numero });
    if (!prontaParaEnviar(salvo.conversa.ficha)) return Response.json({ erro: "incompleta" }, { status: 422 });

    const numero = await confirmarPedido(id, corpo.novidades === true, consentimento.versao);
    return Response.json({ numero });
  } catch (err) {
    console.error("[pedido]", err);
    return Response.json({ erro: "servidor" }, { status: 500 });
  }
}
