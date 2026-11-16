import "server-only";
import { contexto } from "@/content/atendente";
import { formatarReais, marca, servicos } from "@/content/site";
import { avaliarLead } from "@/lib/avaliacao";
import {
  liberarEmail,
  obterLead,
  reservarEmail,
  salvarAvaliacao,
  usandoArquivoLocal,
  type Avaliacao,
  type LeadCompleto,
} from "@/lib/db";

// Dois e-mails por pedido enviado, pelo Resend (resend.com):
//   1. Aviso para você: o lead, a avaliação da IA e a conversa.
//   2. Confirmação para o cliente (se ele deu e-mail): registro do pedido, próximos passos e cópia da conversa.
//
// Variáveis no .env.local:
//   RESEND_API_KEY   chave da conta Resend
//   NOTIFICAR_EMAIL  para quem vai o aviso (pode ser mais de um, separados por vírgula). O primeiro
//                    também recebe as respostas do cliente (reply-to).
//   EMAIL_REMETENTE  remetente com domínio verificado no Resend, ex.: "Kriai <contato@kriai.com.br>".
//                    Sem ele, o Resend usa onboarding@resend.dev, que só entrega para o dono da conta:
//                    o aviso para você funciona, mas o e-mail ao cliente fica desligado.
const REMETENTE_TESTE = `${marca.nome} <onboarding@resend.dev>`;
const remetente = () => process.env.EMAIL_REMETENTE || REMETENTE_TESTE;
const destinatariosAviso = () => (process.env.NOTIFICAR_EMAIL ?? "").split(",").map((e) => e.trim()).filter(Boolean);
export const emailClienteLigado = () => !!process.env.RESEND_API_KEY && !!process.env.EMAIL_REMETENTE;

const esc = (t: string) => t.replace(/[&<>"']/g, (c) => `&#${c.charCodeAt(0)};`);
const soDigitos = (t: string) => t.replace(/\D/g, "");
const emailValido = (e?: string) => !!e && /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim());
const real = (t: string) => !!t && !t.includes("[SUBSTITUIR]"); // ignora dados ainda não preenchidos

/** Link de WhatsApp com a mensagem já escrita. Números sem DDI recebem o 55 do Brasil. */
export function linkWhatsApp(numero: string, mensagem?: string) {
  let n = soDigitos(numero);
  if (n.length <= 11) n = `55${n}`;
  return `https://wa.me/${n}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}

const ROTULO_TEMPERATURA: Record<Avaliacao["temperatura"], string> = { quente: "🔥 Quente", morno: "🌤 Morno", frio: "❄️ Frio" };

/* ---------- layout dos e-mails ----------
   Tabelas e estilos inline: é o que funciona no Gmail, Outlook e Apple Mail. Cores da marca: fita (#e7c75c) e breu. */
const COR = { fita: "#e7c75c", tintaFita: "#14120a", breu: "#0c0f0e", texto: "#1d211f", apoio: "#5f6763", linha: "#e7e4dc", fundo: "#f2f0ea", zap: "#1faa59" };
const FONTE = "font-family:system-ui,-apple-system,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

/** Moldura comum: fundo, faixa da marca, cartão branco e rodapé. `resumo` é o texto de pré-visualização da caixa de entrada. */
function moldura(conteudo: string, { resumo, rodape }: { resumo: string; rodape?: string }) {
  return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="color-scheme" content="light"><title>${esc(marca.nome)}</title></head>
<body style="margin:0;padding:0;background:${COR.fundo}">
<div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(resumo)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${COR.fundo}"><tr><td align="center" style="padding:24px 12px">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:600px;${FONTE};color:${COR.texto};font-size:15px;line-height:1.55">
<tr><td style="background:${COR.breu};padding:18px 28px;border-radius:10px 10px 0 0">
<span style="display:inline-block;background:${COR.fita};color:${COR.tintaFita};padding:5px 12px 4px;font-weight:900;font-size:15px;letter-spacing:.06em;text-transform:uppercase">${esc(marca.nome)}</span>
</td></tr>
<tr><td style="background:#fff;padding:28px;border-radius:0 0 10px 10px">${conteudo}</td></tr>
${rodape ? `<tr><td style="padding:18px 28px 0;color:${COR.apoio};font-size:12px;line-height:1.5">${rodape}</td></tr>` : ""}
</table></td></tr></table></body></html>`;
}

/** Botão que funciona em todo cliente de e-mail (tabela + link com padding). */
const botao = (href: string, texto: string, cor: string, corTexto = "#fff") =>
  `<table role="presentation" cellpadding="0" cellspacing="0" style="display:inline-table;margin:0 8px 8px 0"><tr><td style="background:${cor};border-radius:6px"><a href="${href}" style="display:inline-block;padding:12px 20px;color:${corTexto};font-weight:700;font-size:15px;text-decoration:none">${esc(texto)}</a></td></tr></table>`;

const titulo2 = (t: string) =>
  `<h2 style="margin:28px 0 12px;font-size:13px;letter-spacing:.08em;text-transform:uppercase;color:${COR.apoio}">${esc(t)}</h2>`;
const plano = (lead: LeadCompleto) =>
  servicos.filter((s) => lead.ficha.servicos.includes(s.id)).map((s) => s.nome).join(" + ") || "a definir";

function tabelaHtml(linhas: [string, string | undefined][]) {
  return `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border-collapse:collapse;font-size:14px;margin:0 0 8px">${linhas
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:9px 14px 9px 0;border-bottom:1px solid ${COR.linha};color:${COR.apoio};vertical-align:top;white-space:nowrap;width:120px">${k}</td><td style="padding:9px 0;border-bottom:1px solid ${COR.linha}">${esc(v!)}</td></tr>`,
    )
    .join("")}</table>`;
}
const tabelaTexto = (linhas: [string, string | undefined][]) => linhas.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");

function conversaHtml(lead: LeadCompleto, nomeCliente: string) {
  return lead.mensagens
    .map((m) => {
      const cliente = m.papel === "cliente";
      return `<div style="margin:0 0 8px;padding:10px 14px;border-radius:8px;border-left:3px solid ${cliente ? COR.fita : COR.linha};background:${cliente ? "#fbf6e3" : "#f6f5f1"};font-size:14px">
<div style="font-size:12px;font-weight:700;color:${COR.apoio};margin-bottom:2px">${esc(cliente ? nomeCliente : contexto.nomeAtendente || marca.nome)}</div>
<div style="white-space:pre-wrap">${esc(m.texto)}</div></div>`;
    })
    .join("");
}
const conversaTexto = (lead: LeadCompleto, nomeCliente: string) =>
  lead.mensagens.map((m) => `${m.papel === "cliente" ? nomeCliente : contexto.nomeAtendente || marca.nome}: ${m.texto}`).join("\n\n");

/* ---------- 1. aviso para você ---------- */

function emailAviso(lead: LeadCompleto, av: Avaliacao | null, link: string) {
  const f = lead.ficha;
  const quem = f.nome || "Sem nome";
  const assunto = av
    ? `${ROTULO_TEMPERATURA[av.temperatura]} ${av.nota}/100 · ${quem}${f.negocio ? ` (${f.negocio})` : ""} · pedido ${lead.numero}`
    : `Novo pedido ${lead.numero} · ${quem}`;
  const linhas: [string, string | undefined][] = [
    ["Plano", `${plano(lead)} · a partir de ${formatarReais(lead.valorMinimo)}`],
    ["Negócio", f.negocio],
    ["Cidade", f.cidade],
    ["Objetivo", f.objetivo],
    ["Já tem", f.ja_tem],
    ["Prazo", f.prazo],
    ["Investimento", f.investimento],
    ["WhatsApp", f.whatsapp],
    ["E-mail", f.email],
    ["Observações", f.observacoes],
  ];
  const lista = (itens: string[]) =>
    itens.length ? `<ul style="margin:0 0 16px;padding-left:20px;font-size:14px">${itens.map((i) => `<li style="margin:0 0 4px">${esc(i)}</li>`).join("")}</ul>` : "";
  const botoes =
    (f.whatsapp ? botao(linkWhatsApp(f.whatsapp, av?.mensagem_sugerida), "Responder no WhatsApp", COR.zap) : "") +
    botao(link, "Abrir no painel", COR.breu);

  const conteudo = `<p style="margin:0 0 4px;color:${COR.apoio};font-size:13px">Novo pedido pelo site · nº ${esc(lead.numero ?? "")}</p>
<h1 style="margin:0 0 20px;font-size:24px;line-height:1.25">${esc(quem)}${f.negocio ? ` <span style="color:${COR.apoio};font-weight:400">· ${esc(f.negocio)}</span>` : ""}</h1>
${
  av
    ? `<div style="background:${COR.fundo};border-radius:8px;padding:16px 18px;margin:0 0 20px">
<p style="margin:0 0 8px;font-size:18px;font-weight:800">${ROTULO_TEMPERATURA[av.temperatura]} <span style="display:inline-block;margin-left:6px;padding:2px 8px;border-radius:999px;background:${COR.fita};color:${COR.tintaFita};font-size:14px">${av.nota}/100</span></p>
<p style="margin:0 0 10px">${esc(av.resumo)}</p>
<p style="margin:0"><strong>Próximo passo:</strong> ${esc(av.proximo_passo)}</p>
</div>
${av.pontos_fortes.length ? `<p style="margin:0 0 6px;font-weight:700">Pontos fortes</p>${lista(av.pontos_fortes)}` : ""}
${av.alertas.length ? `<p style="margin:0 0 6px;font-weight:700">Alertas</p>${lista(av.alertas)}` : ""}
<p style="margin:0 0 6px;font-weight:700">Mensagem sugerida</p>
<p style="margin:0 0 20px;padding:12px 14px;border-left:3px solid ${COR.zap};background:#f1faf4;border-radius:0 6px 6px 0">${esc(av.mensagem_sugerida)}</p>`
    : `<p style="margin:0 0 20px;padding:12px 14px;background:#fdeceb;color:#9b1c13;border-radius:6px">A avaliação automática falhou. Abra o painel para avaliar de novo.</p>`
}
<div style="margin:0 0 20px">${botoes}</div>
${titulo2("Ficha do pedido")}
${tabelaHtml(linhas)}
${titulo2("Conversa")}
${conversaHtml(lead, quem)}`;
  const html = moldura(conteudo, { resumo: av ? `${av.nota}/100 · ${av.resumo}` : `Novo pedido de ${quem}` });

  const texto = [
    assunto,
    av ? `${av.resumo}\nPróximo passo: ${av.proximo_passo}\n\nMensagem sugerida:\n${av.mensagem_sugerida}` : "",
    tabelaTexto(linhas),
    `Painel: ${link}`,
    `--- Conversa ---\n${conversaTexto(lead, quem)}`,
  ]
    .filter(Boolean)
    .join("\n\n");
  return { assunto, html, texto };
}

/* ---------- 2. confirmação para o cliente ---------- */

function emailCliente(lead: LeadCompleto) {
  const f = lead.ficha;
  const nome = f.nome?.split(" ")[0] || "Olá";
  const assunto = `Recebemos seu pedido nº ${lead.numero} · ${marca.nome}`;
  const linhas: [string, string | undefined][] = [
    ["Pedido", `nº ${lead.numero}`],
    ["Plano", `${plano(lead)} · a partir de ${formatarReais(lead.valorMinimo)}`],
    ["Negócio", f.negocio],
    ["Cidade", f.cidade],
    ["Objetivo", f.objetivo],
    ["Prazo", f.prazo],
    ["WhatsApp", f.whatsapp],
    ["E-mail", f.email],
  ];
  const contatos = [
    real(marca.whatsapp) ? `WhatsApp: ${marca.whatsapp}` : "",
    real(marca.email) ? `E-mail: ${marca.email}` : "",
  ].filter(Boolean);

  const passos = contexto.comoFunciona
    .map(
      (p, i) =>
        `<tr><td style="width:34px;padding:0 0 12px;vertical-align:top"><span style="display:inline-block;width:24px;height:24px;line-height:24px;text-align:center;border-radius:999px;background:${COR.fita};color:${COR.tintaFita};font-weight:800;font-size:13px">${i + 1}</span></td><td style="padding:2px 0 12px;font-size:14px">${esc(p)}</td></tr>`,
    )
    .join("");

  const conteudo = `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${esc(nome)}, recebemos seu pedido!</h1>
<p style="margin:0 0 16px">Obrigado por falar com a ${esc(marca.nome)}. Uma pessoa da nossa equipe vai revisar tudo e mandar a proposta com o valor final em até <strong>${esc(marca.prazoResposta)}</strong>, pelo WhatsApp ou por este e-mail.</p>
<div style="margin:0 0 8px;padding:14px 18px;background:${COR.fundo};border-left:4px solid ${COR.fita};border-radius:0 8px 8px 0">
<p style="margin:0;font-size:13px;color:${COR.apoio}">Pedido nº ${esc(lead.numero ?? "")}</p>
<p style="margin:2px 0 0;font-size:17px;font-weight:800">${esc(plano(lead))} <span style="font-weight:400;color:${COR.apoio}">· a partir de ${esc(formatarReais(lead.valorMinimo))}</span></p>
</div>
${titulo2("Resumo")}
${tabelaHtml(linhas)}
<p style="margin:0 0 4px;color:${COR.apoio};font-size:13px">Os valores são "a partir de". O preço final vem na proposta, de acordo com o que você precisa.</p>
${titulo2("Como funciona daqui para frente")}
<table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 0 8px">${passos}</table>
<p style="margin:0 0 4px">Quer mudar ou acrescentar algo? É só responder este e-mail.${contatos.length ? ` Ou fale com a gente: ${esc(contatos.join(" · "))}.` : ""}</p>
${titulo2("Sua conversa com a gente")}
${conversaHtml(lead, f.nome || "Você")}`;
  const html = moldura(conteudo, {
    resumo: `Pedido nº ${lead.numero} recebido. A proposta chega em até ${marca.prazoResposta}.`,
    rodape: `Você recebeu este e-mail porque enviou um pedido em ${esc(marca.dominio)}. Seus dados são usados só para preparar o orçamento, como explica nossa <a href="https://${esc(marca.dominio)}/privacidade" style="color:${COR.apoio}">política de privacidade</a>.`,
  });

  const texto = [
    `${nome}, recebemos seu pedido. Obrigado por falar com a ${marca.nome}!`,
    `Uma pessoa da nossa equipe vai revisar tudo e mandar a proposta com o valor final em até ${marca.prazoResposta}, pelo WhatsApp ou por este e-mail.`,
    tabelaTexto(linhas),
    `Como funciona daqui para frente:\n${contexto.comoFunciona.map((p, i) => `${i + 1}. ${p}`).join("\n")}`,
    `Quer mudar ou acrescentar algo? É só responder este e-mail.${contatos.length ? ` Ou fale com a gente: ${contatos.join(" · ")}.` : ""}`,
    `--- Sua conversa com a gente ---\n${conversaTexto(lead, f.nome || "Você")}`,
    `Você recebeu este e-mail porque enviou um pedido em ${marca.dominio}. Política de privacidade: https://${marca.dominio}/privacidade`,
  ].join("\n\n");
  return { assunto, html, texto };
}

/* ---------- envio ---------- */

type Email = { para: string[]; assunto: string; html: string; texto: string; responderPara?: string };

async function enviar(e: Email) {
  const chave = process.env.RESEND_API_KEY;
  if (!chave) {
    console.warn("[email] RESEND_API_KEY não configurada: e-mail não enviado.");
    return false;
  }
  const r = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${chave}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      from: remetente(),
      to: e.para,
      subject: e.assunto,
      html: e.html,
      text: e.texto,
      ...(e.responderPara ? { reply_to: e.responderPara } : {}),
    }),
  });
  if (!r.ok) throw new Error(`Resend respondeu ${r.status}: ${await r.text()}`);
  return true;
}

/** Avalia o lead e salva. Devolve a avaliação, ou null se a IA falhar (o erro vai para o log). */
export async function avaliarESalvar(lead: LeadCompleto) {
  try {
    const av = await avaliarLead(lead);
    await salvarAvaliacao(lead.id, av);
    return av;
  } catch (err) {
    console.error("[avaliacao]", lead.id, err);
    return null;
  }
}

/** Avisa você por e-mail. Só manda uma vez por lead; se falhar, libera para tentar de novo pelo painel. */
export async function notificarLead(lead: LeadCompleto, av: Avaliacao | null, baseUrl: string) {
  const para = destinatariosAviso();
  if (!para.length) {
    console.warn("[email] NOTIFICAR_EMAIL não configurado: aviso não enviado.");
    return false;
  }
  if (!(await reservarEmail(lead.id, "notificada_em"))) return false;
  try {
    const ok = await enviar({
      para,
      ...emailAviso(lead, av, `${baseUrl}/admin/${lead.id}`),
      // responder o aviso já abre um e-mail para o cliente
      responderPara: emailValido(lead.ficha.email) ? lead.ficha.email!.trim() : undefined,
    });
    if (!ok) await liberarEmail(lead.id, "notificada_em");
    return ok;
  } catch (err) {
    console.error("[email aviso]", lead.id, err);
    await liberarEmail(lead.id, "notificada_em");
    return false;
  }
}

export type ResultadoCliente = "enviado" | "sem_email" | "nao_enviado_ainda" | "desligado" | "ja_enviado" | "falhou";

/** Manda ao cliente o registro do pedido e a cópia da conversa. Só para pedido enviado, uma vez. */
export async function enviarConfirmacaoCliente(lead: LeadCompleto): Promise<ResultadoCliente> {
  if (lead.situacao !== "enviado") return "nao_enviado_ainda";
  if (!emailValido(lead.ficha.email)) return "sem_email";
  if (!emailClienteLigado()) {
    console.warn(
      "[email cliente] desligado: configure EMAIL_REMETENTE com um domínio verificado no Resend (onboarding@resend.dev só entrega para você).",
    );
    return "desligado";
  }
  if (!(await reservarEmail(lead.id, "email_cliente_em"))) return "ja_enviado";
  try {
    await enviar({ para: [lead.ficha.email!.trim()], ...emailCliente(lead), responderPara: destinatariosAviso()[0] });
    return "enviado";
  } catch (err) {
    console.error("[email cliente]", lead.id, err);
    await liberarEmail(lead.id, "email_cliente_em");
    return "falhou";
  }
}

/** Chamado depois que o cliente envia o pedido: avalia, avisa você e confirma para o cliente. Nunca lança erro. */
export async function processarPedidoEnviado(id: string, baseUrl: string) {
  if (usandoArquivoLocal()) return;
  try {
    const lead = await obterLead(id);
    if (!lead) return;
    // a confirmação ao cliente não espera a avaliação da IA
    const cliente = enviarConfirmacaoCliente(lead);
    const av = lead.avaliacao ?? (await avaliarESalvar(lead));
    await Promise.all([notificarLead(lead, av, baseUrl), cliente]);
  } catch (err) {
    console.error("[pedido enviado]", id, err);
  }
}
