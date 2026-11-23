import "server-only";
import { marca } from "@/content/site";
import type { EstadoPedido } from "@/lib/db";
import { COR, botao, esc, moldura, titulo2 } from "@/lib/notificacao";

// E-mails que o cliente da landing page recebe depois de pagar.

const zap = `https://wa.me/55${marca.whatsapp.replace(/\D/g, "")}`;
const insta = `https://instagram.com/${marca.instagram}`;

/** Bloco de contato comercial, no fim dos e-mails ao cliente. */
const contatos = () => `${titulo2("Fale com a gente")}
<p style="margin:0 0 6px">WhatsApp comercial: <a href="${zap}" style="color:${COR.texto};font-weight:700">${esc(marca.whatsapp)}</a></p>
<p style="margin:0 0 6px">Instagram: <a href="${insta}" style="color:${COR.texto};font-weight:700">@${esc(marca.instagram)}</a></p>
<p style="margin:0">E-mail: <a href="mailto:${marca.email}" style="color:${COR.texto}">${esc(marca.email)}</a></p>`;

const contatosTexto = () =>
  `WhatsApp comercial: ${marca.whatsapp} (${zap})\nInstagram: @${marca.instagram} (${insta})\nE-mail: ${marca.email}`;

const rodape = `${marca.nome} · ${marca.dominio} · Você recebeu este e-mail porque contratou um site com a gente.`;

/** Boas-vindas: sai assim que o pagamento é aprovado. */
export function emailBoasVindas(p: EstadoPedido, acompanhar: string) {
  const nome = p.ficha.nome?.split(" ")[0] || "Olá";
  const provisorio = p.siteSlug ? `${p.siteSlug}.kriai.online` : "um endereço provisório";
  const html = moldura(
    `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${esc(nome)}, seja bem-vindo(a) à ${esc(marca.nome)}! 🎉</h1>
<p style="margin:0 0 12px">Obrigado pela confiança. Recebemos o pagamento do pedido nº ${esc(p.numero ?? "")}${p.ficha.negocio ? ` e o site de <b>${esc(p.ficha.negocio)}</b> já começou a ser feito` : " e o seu site já começou a ser feito"}.</p>
${titulo2("O que acontece agora")}
<ol style="margin:0 0 16px;padding-left:20px">
<li style="margin:0 0 6px">Criamos o site com o que combinamos na conversa e revisamos antes de liberar.</li>
<li style="margin:0 0 6px">Ele fica no ar primeiro em <b>${esc(provisorio)}</b>, e você recebe um e-mail com o link.</li>
<li style="margin:0 0 6px">Você confere e pede o ajuste incluído, respondendo o e-mail ou pelo WhatsApp.</li>
<li style="margin:0">Mandamos o passo a passo para colocar o site no seu domínio${p.dominio ? ` (${esc(p.dominio)})` : ""}.</li>
</ol>
${botao(acompanhar, "Acompanhar meu pedido", COR.breu)}
${contatos()}`,
    { resumo: `Pagamento confirmado. Seu site já está sendo feito.`, rodape },
  );
  const texto = [
    `${nome}, seja bem-vindo(a) à ${marca.nome}! Obrigado pela confiança.`,
    `Recebemos o pagamento do pedido nº ${p.numero} e o seu site já começou a ser feito.`,
    `O que acontece agora:\n1. Criamos o site com o que combinamos e revisamos antes de liberar.\n2. Ele fica no ar primeiro em ${provisorio}, e você recebe o link por e-mail.\n3. Você confere e pede o ajuste incluído.\n4. Mandamos o passo a passo para colocar o site no seu domínio.`,
    `Acompanhe: ${acompanhar}`,
    contatosTexto(),
  ].join("\n\n");
  return { assunto: `Bem-vindo(a) à ${marca.nome} · pedido ${p.numero}`, html, texto };
}

/* ---------- guia de DNS ---------- */

// Registros padrão da Vercel para um domínio próprio.
const REGISTROS = [
  { tipo: "A", nome: "@ (ou deixe em branco)", valor: "76.76.21.21" },
  { tipo: "CNAME", nome: "www", valor: "cname.vercel-dns.com" },
];

type Guia = { painel: string; caminho: string };
function guiaDo(registrador?: string | null): Guia {
  const r = (registrador ?? "").toLowerCase();
  if (r.includes("registro")) return { painel: "Registro.br", caminho: "registro.br › Entrar › clique no domínio › DNS › Configurar zona DNS (ou Editar zona)" };
  if (r.includes("hostinger")) return { painel: "Hostinger", caminho: "hPanel › Domínios › seu domínio › DNS / Nameservers › Gerenciar registros DNS" };
  if (r.includes("godaddy")) return { painel: "GoDaddy", caminho: "Meus produtos › seu domínio › DNS › Gerenciar DNS" };
  if (r.includes("locaweb")) return { painel: "Locaweb", caminho: "Central do Cliente › Domínios › seu domínio › Zona de DNS" };
  if (r.includes("hostgator")) return { painel: "HostGator", caminho: "Portal do Cliente › Domínios › seu domínio › Gerenciar DNS (ou Zone Editor no cPanel)" };
  if (r.includes("cloudflare")) return { painel: "Cloudflare", caminho: "Painel › seu domínio › DNS › Records (deixe a nuvem em cinza: DNS only)" };
  return { painel: registrador || "o painel onde você registrou o domínio", caminho: "procure a área DNS, Zona DNS ou Gerenciar DNS do domínio" };
}

function blocoDns(p: EstadoPedido) {
  if (!p.dominio) {
    return {
      html: `<p style="margin:0 0 12px">Quando quiser um endereço próprio (ex.: seunegocio.com.br), é só responder este e-mail que a gente confere se está livre e te ajuda a registrar.</p>`,
      texto: "Quando quiser um endereço próprio (ex.: seunegocio.com.br), responda este e-mail que a gente ajuda.",
    };
  }
  const g = guiaDo(p.dominio.endsWith(".br") && !p.ficha.registrador ? "registro.br" : p.ficha.registrador);
  const registrar =
    p.dominioStatus === "livre"
      ? `<p style="margin:0 0 12px"><b>1. Registre o domínio.</b> ${esc(p.dominio)} estava livre quando conferimos. Registre em <a href="https://registro.br" style="color:${COR.texto}">registro.br</a> no seu CPF ou CNPJ (cerca de R$ 40 por ano, pago direto a eles). Assim ele fica no seu nome.</p>`
      : "";
  const n = p.dominioStatus === "livre" ? 2 : 1;
  const tabela = REGISTROS.map(
    (r) =>
      `<tr><td style="padding:8px 10px;border:1px solid #ddd;font-weight:700">${r.tipo}</td><td style="padding:8px 10px;border:1px solid #ddd">${esc(r.nome)}</td><td style="padding:8px 10px;border:1px solid #ddd;font-family:monospace">${r.valor}</td></tr>`,
  ).join("");
  const html = `${registrar}<p style="margin:0 0 8px"><b>${n}. Abra o DNS no ${esc(g.painel)}.</b> Caminho: ${esc(g.caminho)}.</p>
<p style="margin:0 0 8px"><b>${n + 1}. Crie ou altere estes 2 registros</b> (se já existir um registro A em "@" ou um "www", troque o valor):</p>
<table role="presentation" cellpadding="0" cellspacing="0" style="border-collapse:collapse;margin:0 0 12px;font-size:14px"><tr><th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Tipo</th><th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Nome</th><th style="padding:8px 10px;border:1px solid #ddd;text-align:left">Valor</th></tr>${tabela}</table>
<p style="margin:0 0 8px"><b>Não mexa nos registros MX nem nos TXT do seu e-mail.</b> Eles fazem seu e-mail funcionar e continuam do jeito que estão.</p>
<p style="margin:0 0 8px"><b>${n + 2}. Pronto.</b> A mudança leva de alguns minutos a algumas horas para valer. O cadeado (https) é ativado sozinho.</p>
<p style="margin:0 0 12px">Se o painel do Registro.br não mostrar a zona DNS, ative "Utilizar os servidores DNS do Registro.br" primeiro. Travou em algum passo? Mande um print pelo WhatsApp que a gente faz junto com você.</p>`;
  const texto = [
    p.dominioStatus === "livre" ? `1. Registre ${p.dominio} em registro.br no seu CPF ou CNPJ (cerca de R$ 40/ano).` : "",
    `${n}. Abra o DNS no ${g.painel}: ${g.caminho}.`,
    `${n + 1}. Crie ou altere: ${REGISTROS.map((r) => `${r.tipo} ${r.nome} → ${r.valor}`).join(" | ")}`,
    "Não mexa nos registros MX e TXT do seu e-mail.",
    `${n + 2}. A mudança leva de minutos a algumas horas. O https é ativado sozinho.`,
  ]
    .filter(Boolean)
    .join("\n");
  return { html, texto };
}

/** Site no ar: link, ajuste incluído e o guia para apontar o domínio. */
export function emailSiteNoAr(p: EstadoPedido) {
  const nome = p.ficha.nome?.split(" ")[0] || "Olá";
  const dns = blocoDns(p);
  const html = moldura(
    `<h1 style="margin:0 0 12px;font-size:24px;line-height:1.25">${esc(nome)}, seu site está no ar! 🚀</h1>
<p style="margin:0 0 16px">Confira em <a href="${esc(p.siteUrl ?? "")}" style="color:${COR.texto};font-weight:700">${esc(p.siteUrl ?? "")}</a>. Você tem 1 rodada de ajustes incluída: responda este e-mail ou chame no WhatsApp com tudo o que quer mudar, de uma vez.</p>
${botao(p.siteUrl ?? "", "Ver meu site", COR.breu)}
${titulo2(p.dominio ? `Colocar o site em ${p.dominio}` : "Endereço próprio")}
${dns.html}
${contatos()}`,
    { resumo: "Seu site está no ar. Veja como colocar no seu domínio.", rodape },
  );
  const texto = [
    `${nome}, seu site está no ar: ${p.siteUrl}`,
    "Você tem 1 rodada de ajustes incluída: responda este e-mail ou chame no WhatsApp.",
    p.dominio ? `Colocar o site em ${p.dominio}:\n${dns.texto}` : dns.texto,
    contatosTexto(),
  ].join("\n\n");
  return { assunto: `Seu site está no ar · pedido ${p.numero}`, html, texto };
}
