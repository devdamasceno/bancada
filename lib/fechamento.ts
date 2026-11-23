import "server-only";
import { consentimento, servicos } from "@/content/site";
import { confirmarPedido, obterConversa, obterEstadoPedido, salvarCobranca, slugEmUso, usandoArquivoLocal } from "@/lib/db";
import { criarSlug, normalizarDominio, verificarDominio } from "@/lib/dominio";
import { pagamentoAutomatico, prontaParaEnviar, type Ficha } from "@/lib/ficha";
import { criarPreferencia, mercadoPagoLigado } from "@/lib/mercadopago";

export type Fechamento = { numero: string; link: string | null; acompanhar: string | null; valor: number | null };

/**
 * Fecha o pedido: confirma (status "enviado") e, se for só o site de 1 página, cria o link do Mercado Pago.
 * Pode ser chamado de novo sem duplicar nada: devolve o mesmo número e o mesmo link.
 */
export async function fecharPedido(id: string, base: string, aceitaNovidades = false): Promise<Fechamento | null> {
  const salvo = await obterConversa(id);
  if (!salvo || !prontaParaEnviar(salvo.conversa.ficha)) return null;
  const numero =
    salvo.conversa.status === "enviado" ? salvo.conversa.numero : await confirmarPedido(id, aceitaNovidades, consentimento.versao);
  if (!numero) return null;

  if (!pagamentoAutomatico(salvo.conversa.ficha) || !mercadoPagoLigado() || usandoArquivoLocal()) {
    return { numero, link: null, acompanhar: null, valor: null };
  }
  const estado = await obterEstadoPedido(id);
  if (estado?.mpLink) return { numero, link: estado.mpLink, acompanhar: `${base}/pedido/${id}`, valor: estado.valorCobrado };

  const link = await prepararCobranca(id, numero, salvo.conversa.ficha, base);
  const site = servicos.find((s) => s.id === "site")!;
  return { numero, link, acompanhar: `${base}/pedido/${id}`, valor: site.aPartirDe };
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
    // ocupado pode ser o próprio cliente, que já tem o domínio
    dominioStatus: verificado?.status ?? null,
    slug,
  });
  return pref.link;
}
