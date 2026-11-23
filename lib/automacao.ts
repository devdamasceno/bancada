import "server-only";
import { marca } from "@/content/site";
import { liberarGeracao, obterEstadoPedido, reservarGeracao } from "@/lib/db";
import { dispararGeracao, geracaoLigada } from "@/lib/geracao";
import { COR, botao, destinatariosAviso, emailValido, enviar, esc, moldura } from "@/lib/notificacao";

/**
 * Pagou: coloca o site na fila (site_status = 'na_fila') uma única vez.
 * A tarefa agendada "Kriai · gerar site do pedido pago" passa de hora em hora pegando a fila.
 * Se o disparo imediato estiver configurado (KRIAI_ROTINA_URL + KRIAI_ROTINA_TOKEN), já chama a tarefa na hora.
 */
export async function iniciarGeracao(id: string, base: string) {
  const p = await obterEstadoPedido(id);
  if (!p?.numero || !p.siteSlug) return;
  if (!(await reservarGeracao(id))) return; // já está na fila ou foi disparado
  if (!geracaoLigada()) return; // fica na fila para a próxima passada da tarefa
  try {
    await dispararGeracao({ conversaId: id, numero: p.numero, slug: p.siteSlug, baseUrl: base });
  } catch (err) {
    console.error("[geracao]", id, err);
    await liberarGeracao(id, err instanceof Error ? err.message : String(err));
  }
}

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
<p style="margin:0 0 18px">${geracaoLigada() ? "A geração do site já foi disparada." : "O site entrou na fila: a tarefa de geração pega na próxima passada (de hora em hora)."}</p>
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
      const html = moldura(
        `<p style="margin:0 0 12px;font-size:18px;font-weight:700">Pagamento confirmado! 🎉</p>
<p style="margin:0 0 12px">Oi, ${esc(f.nome ?? "")}! Recebemos o pagamento do pedido nº ${esc(p.numero ?? "")} e o seu site já está sendo feito.</p>
<p style="margin:0 0 18px">Quando ficar pronto, ele aparece primeiro em <b>${esc(provisorio ?? "um endereço provisório")}</b> para você conferir e pedir o ajuste incluído. Você também pode acompanhar por aqui:</p>
${botao(acompanhar, "Acompanhar meu pedido", COR.breu)}`,
        { resumo: "Pagamento confirmado. Seu site já está sendo feito.", rodape: `${marca.nome} · ${marca.dominio}` },
      );
      await enviar({
        para: [f.email!.trim()],
        assunto: `Pagamento confirmado · pedido ${p.numero}`,
        html,
        texto: `Recebemos o pagamento do pedido ${p.numero}. Acompanhe em ${acompanhar}`,
      });
    }
  } catch (err) {
    console.error("[email pagamento cliente]", id, err);
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
      const dominio =
        p.dominio && p.dominioStatus === "livre"
          ? `<p style="margin:0 0 12px">Para usar <b>${esc(p.dominio)}</b>: registre em <a href="https://registro.br">registro.br</a> no seu CPF ou CNPJ e nos avise pela página do pedido. A gente aponta o site para ele.</p>`
          : "";
      await enviar({
        para: [f.email!.trim()],
        assunto: `Seu site está no ar · pedido ${p.numero}`,
        html: moldura(
          `<p style="margin:0 0 12px;font-size:18px;font-weight:700">Seu site está no ar! 🚀</p>
<p style="margin:0 0 12px">Oi, ${esc(f.nome ?? "")}! Confira em <a href="${esc(p.siteUrl)}">${esc(p.siteUrl)}</a>. Você tem 1 rodada de ajustes incluída: é só responder este e-mail com o que quer mudar.</p>
${dominio}${botao(p.siteUrl, "Ver meu site", COR.breu)}`,
          { resumo: "Seu site está no ar", rodape: `${marca.nome} · ${marca.dominio}` },
        ),
        texto: `Seu site está no ar: ${p.siteUrl}`,
        responderPara: marca.email,
      });
    }
  } catch (err) {
    console.error("[email site publicado]", id, err);
  }
}
