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

const FONTE = "font-family:system-ui,-apple-system,Segoe UI,Roboto,sans-serif;max-width:600px;color:#111;line-height:1.5";
const plano = (lead: LeadCompleto) =>
  servicos.filter((s) => lead.ficha.servicos.includes(s.id)).map((s) => s.nome).join(" + ") || "a definir";

function tabelaHtml(linhas: [string, string | undefined][]) {
  return `<table style="border-collapse:collapse;font-size:14px;margin-bottom:20px">${linhas
    .filter(([, v]) => v)
    .map(
      ([k, v]) =>
        `<tr><td style="padding:4px 12px 4px 0;color:#666;vertical-align:top;white-space:nowrap">${k}</td><td style="padding:4px 0">${esc(v!)}</td></tr>`,
    )
    .join("")}</table>`;
}
const tabelaTexto = (linhas: [string, string | undefined][]) => linhas.filter(([, v]) => v).map(([k, v]) => `${k}: ${v}`).join("\n");

function conversaHtml(lead: LeadCompleto, nomeCliente: string) {
  return lead.mensagens
    .map((m) => {
      const cliente = m.papel === "cliente";
      return `<div style="margin:0 0 8px;padding:8px 12px;border-radius:8px;background:${cliente ? "#eef4ff" : "#f4f4f2"}">
<div style="font-size:12px;color:#666;margin-bottom:2px">${esc(cliente ? nomeCliente : contexto.nomeAtendente || marca.nome)}</div>
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
    itens.length ? `<ul style="margin:4px 0 12px;padding-left:20px">${itens.map((i) => `<li>${esc(i)}</li>`).join("")}</ul>` : "";
  const botaoZap = f.whatsapp
    ? `<a href="${linkWhatsApp(f.whatsapp, av?.mensagem_sugerida)}" style="display:inline-block;background:#25d366;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600;margin-right:8px">Responder no WhatsApp</a>`
    : "";

  const html = `<div style="${FONTE}">
<p style="margin:0 0 4px;color:#666;font-size:13px">Novo pedido pelo site · nº ${esc(lead.numero ?? "")}</p>
<h1 style="margin:0 0 12px;font-size:22px">${esc(quem)}${f.negocio ? ` · ${esc(f.negocio)}` : ""}</h1>
${
  av
    ? `<div style="background:#f6f6f4;border-radius:8px;padding:14px 16px;margin-bottom:16px">
<p style="margin:0 0 6px;font-size:18px"><strong>${ROTULO_TEMPERATURA[av.temperatura]} · ${av.nota}/100</strong></p>
<p style="margin:0 0 10px">${esc(av.resumo)}</p>
<p style="margin:0"><strong>Próximo passo:</strong> ${esc(av.proximo_passo)}</p>
</div>
${av.pontos_fortes.length ? `<strong>Pontos fortes</strong>${lista(av.pontos_fortes)}` : ""}
${av.alertas.length ? `<strong>Alertas</strong>${lista(av.alertas)}` : ""}
<p style="margin:0 0 4px"><strong>Mensagem sugerida</strong></p>
<p style="margin:0 0 16px;padding:10px 12px;border-left:3px solid #25d366;background:#f3fbf6">${esc(av.mensagem_sugerida)}</p>`
    : `<p style="color:#a00">A avaliação automática falhou. Abra o painel para avaliar de novo.</p>`
}
${tabelaHtml(linhas)}
<p>${botaoZap}<a href="${link}" style="display:inline-block;background:#111;color:#fff;padding:10px 16px;border-radius:6px;text-decoration:none;font-weight:600">Abrir no painel</a></p>
<h2 style="font-size:16px;margin:28px 0 10px">Conversa</h2>
${conversaHtml(lead, quem)}
</div>`;

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

  const html = `<div style="${FONTE}">
<p style="margin:0 0 16px">${esc(nome)}, recebemos seu pedido. Obrigado por falar com a ${esc(marca.nome)}!</p>
<p style="margin:0 0 16px">Uma pessoa da nossa equipe vai revisar tudo e mandar a proposta com o valor final em até <strong>${esc(marca.prazoResposta)}</strong>, pelo WhatsApp ou por este e-mail.</p>
${tabelaHtml(linhas)}
<p style="margin:0 0 4px"><strong>Como funciona daqui para frente</strong></p>
<ol style="margin:0 0 16px;padding-left:20px">${contexto.comoFunciona.map((p) => `<li>${esc(p)}</li>`).join("")}</ol>
<p style="margin:0 0 16px;color:#444;font-size:14px">Os valores acima são "a partir de". O preço final vem na proposta, de acordo com o que você precisa.</p>
<p style="margin:0 0 16px">Quer mudar ou acrescentar algo? É só responder este e-mail.${contatos.length ? ` Ou fale com a gente: ${esc(contatos.join(" · "))}.` : ""}</p>
<h2 style="font-size:16px;margin:28px 0 10px">Sua conversa com a gente</h2>
${conversaHtml(lead, f.nome || "Você")}
<p style="margin:24px 0 0;color:#888;font-size:12px">Você recebeu este e-mail porque enviou um pedido em ${esc(marca.dominio)}. Seus dados são usados só para preparar o orçamento, como explica nossa política de privacidade: https://${esc(marca.dominio)}/privacidade</p>
</div>`;

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
