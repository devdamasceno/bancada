import "server-only";
import { marca } from "@/content/site";
import { liberarGeracao, obterEstadoPedido, reservarGeracao } from "@/lib/db";
import { emailBoasVindas, emailSiteNoAr } from "@/lib/emails-cliente";
import { dispararGeracao, geracaoLigada } from "@/lib/geracao";
import { COR, botao, destinatariosAviso, emailValido, enviar, esc, moldura } from "@/lib/notificacao";

/**
 * Pagou: coloca o site na fila (site_status = 'na_fila') uma única vez.
 * Com o disparo configurado (KRIAI_ROTINA_URL + KRIAI_ROTINA_TOKEN), chama na hora a tarefa
 * "Kriai · gerar site do pedido pago", que só roda quando há pedido. Sem o token, o pedido fica na fila
 * e o e-mail de pagamento aprovado traz o atalho para você tocar em "Executar agora".
 */
export async function iniciarGeracao(id: string, base: string) {
  const p = await obterEstadoPedido(id);
  if (!p?.numero || !p.siteSlug) return;
  if (!(await reservarGeracao(id))) return; // já está na fila ou foi disparado
  if (!geracaoLigada()) return; // fica na fila até a tarefa ser executada
  try {
    await dispararGeracao({ conversaId: id, numero: p.numero, slug: p.siteSlug, baseUrl: base });
  } catch (err) {
    console.error("[geracao]", id, err);
    await liberarGeracao(id, err instanceof Error ? err.message : String(err));
  }
}

const TAREFA_URL = process.env.KRIAI_TAREFA_URL || "https://claude.ai/code/routines";

const linhaDominio = (dominio: string | null, status: string | null) =>
  !dominio
    ? "Sem domínio próprio por enquanto."
    : status === "livre"
      ? `${dominio} está livre para registro.`
      : status === "ocupado"
        ? `${dominio} já está registrado (pode ser do próprio cliente).`
        : `${dominio}: não foi possível conferir agora.`;

/** E-mails de pagamento aprovado: aviso para você e confirmação para o cliente. Falha no e-mail não trava nada. */
export async function notificarPagamento(id: string, base: string) {
  const p = await obterEstadoPedido(id);
  if (!p) return;
  const f = p.ficha;
  const acompanhar = `${base}/pedido/${id}`;
  const provisorio = p.siteSlug ? `https://${p.siteSlug}.kriai.online` : null;

  try {
    const para = destinatariosAviso();
    if (para.length) {
      const html = moldura(
        `<p style="margin:0 0 12px;font-size:18px;font-weight:700">💰 Pagamento aprovado · pedido nº ${esc(p.numero ?? "")}</p>
<p style="margin:0 0 6px">${esc(f.nome ?? "Cliente")}${f.negocio ? ` · ${esc(f.negocio)}` : ""} pagou R$ ${p.valorCobrado}.</p>
<p style="margin:0 0 6px">Endereço provisório: ${esc(provisorio ?? "—")}</p>
<p style="margin:0 0 18px">Domínio: ${esc(linhaDominio(p.dominio, p.dominioStatus))}</p>
<p style="margin:0 0 18px">${geracaoLigada() ? "A geração do site já foi disparada." : `O site entrou na fila. Toque em <a href="${TAREFA_URL}">Executar agora</a> na tarefa de geração para criar o site.`}</p>
${botao(`${base}/admin/${id}`, "Abrir no painel", COR.breu)}`,
        { resumo: `Pagamento aprovado do pedido ${p.numero}` },
      );
      await enviar({ para, assunto: `💰 Pago · pedido ${p.numero} · ${f.negocio ?? f.nome ?? ""}`, html, texto: `Pagamento aprovado do pedido ${p.numero}. ${acompanhar}` });
    }
  } catch (err) {
    console.error("[email pagamento aviso]", id, err);
  }

  try {
    if (emailValido(f.email) && process.env.EMAIL_REMETENTE) {
      await enviar({ para: [f.email!.trim()], ...emailBoasVindas(p, acompanhar), responderPara: marca.email });
    }
  } catch (err) {
    console.error("[email boas-vindas]", id, err);
  }
}

/** Site no ar: avisa o cliente com o link e os próximos passos do domínio. */
export async function notificarSitePublicado(id: string, base: string) {
  const p = await obterEstadoPedido(id);
  if (!p?.siteUrl) return;
  const f = p.ficha;
  try {
    const para = destinatariosAviso();
    if (para.length)
      await enviar({
        para,
        assunto: `✅ Site no ar · pedido ${p.numero}`,
        html: moldura(`<p>O site do pedido nº ${esc(p.numero ?? "")} foi publicado em <a href="${esc(p.siteUrl)}">${esc(p.siteUrl)}</a>.</p>${botao(`${base}/admin/${id}`, "Abrir no painel", COR.breu)}`, {
          resumo: "Site publicado",
        }),
        texto: `Site publicado: ${p.siteUrl}`,
      });
    if (emailValido(f.email) && process.env.EMAIL_REMETENTE) {
      await enviar({ para: [f.email!.trim()], ...emailSiteNoAr(p), responderPara: marca.email });
    }
  } catch (err) {
    console.error("[email site publicado]", id, err);
  }
}
