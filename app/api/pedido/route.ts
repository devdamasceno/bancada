import { after } from "next/server";
import { consentimento, servicos } from "@/content/site";
import { confirmarPedido, obterConversa, salvarCobranca, slugEmUso, usandoArquivoLocal } from "@/lib/db";
import { criarSlug, normalizarDominio, verificarDominio } from "@/lib/dominio";
import { pagamentoAutomatico, prontaParaEnviar, type Ficha } from "@/lib/ficha";
import { criarPreferencia, mercadoPagoLigado } from "@/lib/mercadopago";
import { processarPedidoEnviado } from "@/lib/notificacao";

// Dá tempo para a avaliação da IA e o e-mail, que rodam depois da resposta ao cliente.
export const maxDuration = 60;

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
    const base = process.env.SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;

    // Site de 1 página sozinho: já sai com o link de pagamento. Se o Mercado Pago falhar, o pedido segue pelo caminho normal.
    let pagamento: string | null = null;
    if (numero && pagamentoAutomatico(salvo.conversa.ficha) && mercadoPagoLigado() && !usandoArquivoLocal()) {
      try {
        pagamento = await prepararCobranca(id, numero, salvo.conversa.ficha, base);
      } catch (err) {
        console.error("[pedido] cobrança", id, err);
      }
    }

    // Depois de responder ao cliente: avalia o lead e avisa você por e-mail.
    after(() => processarPedidoEnviado(id, base));
    return Response.json({ numero, pagamento, acompanhar: pagamento ? `/pedido/${id}` : null });
  } catch (err) {
    console.error("[pedido]", err);
    return Response.json({ erro: "servidor" }, { status: 500 });
  }
}

async function prepararCobranca(id: string, numero: string, ficha: Ficha, base: string) {
  const site = servicos.find((s) => s.id === "site")!;
  const dominio = normalizarDominio(ficha.dominio);
  const verificado = dominio ? await verificarDominio(dominio) : null;

  // endereço provisório: nome do domínio, senão o nome do negócio; com sufixo se já estiver em uso
  const raiz = criarSlug(dominio ? dominio.split(".")[0] : ficha.negocio || ficha.nome || numero);
  let slug = raiz;
  for (let i = 2; await slugEmUso(slug); i++) slug = `${raiz}-${i}`;

  const pref = await criarPreferencia({
    conversaId: id,
    numero,
    titulo: `${site.nome} de 1 página · Kriai · pedido nº ${numero}`,
    valor: site.aPartirDe,
    nome: ficha.nome,
    email: ficha.email,
    baseUrl: base,
  });
  await salvarCobranca(id, {
    valor: site.aPartirDe,
    preferencia: pref.id,
    link: pref.link,
    dominio,
    // ocupado pode ser o próprio cliente, que já tem o domínio: a página do pedido pergunta
    dominioStatus: verificado?.status ?? null,
    slug,
  });
  return pref.link;
}
