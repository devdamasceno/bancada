import "server-only";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import type Anthropic from "@anthropic-ai/sdk";
import { fichaVazia, valorMinimo, type Ficha } from "@/lib/ficha";

// Banco: Supabase (Postgres) quando SUPABASE_URL e a chave secreta estão configuradas.
// Sem elas, grava em arquivos JSON na pasta data/ — serve só para testar no seu computador.

export type Conteudo = Anthropic.Beta.BetaMessageContentParam;

export type MensagemSalva = {
  papel: "user" | "assistant";
  /** Conteúdo completo, do jeito que volta para a API na próxima mensagem. */
  conteudo: Conteudo;
  /** Versão legível para o painel e para reabrir a conversa. Nulo em mensagens internas (resultado de ferramenta). */
  texto: string | null;
};

export type Conversa = {
  id: string;
  status: "rascunho" | "enviado";
  ficha: Ficha;
  numero: string | null;
  atualizadaEm: string | null;
};

export type Meta = {
  origem: string | null;
  utm: Record<string, string>;
  dispositivo: string | null;
  visitante: string | null;
};

const URL_SB = process.env.SUPABASE_URL;
const CHAVE_SB = process.env.SUPABASE_SECRET_KEY ?? process.env.SUPABASE_SERVICE_ROLE_KEY;

let sb: SupabaseClient | null = null;
function supabase() {
  if (!URL_SB || !CHAVE_SB) return null;
  // schema fixo: as tabelas ficam em public, mesmo que o projeto exponha outro esquema por padrão
  sb ??= createClient(URL_SB, CHAVE_SB, { auth: { persistSession: false }, db: { schema: "public" } });
  return sb;
}

export const usandoArquivoLocal = () => !supabase();

/* ---------- modo local (arquivos) ---------- */

type ArquivoConversa = Conversa & { meta: Meta; criadaEm: string; mensagens: MensagemSalva[] };
const agora = () => new Date().toISOString();
const PASTA = path.join(process.cwd(), "data", "conversas");
const arquivo = (id: string) => path.join(PASTA, `${id}.json`);

async function lerLocal(id: string): Promise<ArquivoConversa | null> {
  try {
    return JSON.parse(await readFile(arquivo(id), "utf8"));
  } catch {
    return null;
  }
}
async function gravarLocal(c: ArquivoConversa) {
  await mkdir(PASTA, { recursive: true });
  await writeFile(arquivo(c.id), JSON.stringify(c, null, 1), "utf8");
}

function falhou(acao: string, erro: { message: string } | null) {
  if (erro) throw new Error(`Supabase: falha ao ${acao}: ${erro.message}`);
}

/* ---------- operações ---------- */

export async function obterConversa(id: string): Promise<{ conversa: Conversa; mensagens: MensagemSalva[] } | null> {
  const db = supabase();
  if (!db) {
    const c = await lerLocal(id);
    return c
      ? {
          conversa: { id: c.id, status: c.status, ficha: c.ficha, numero: c.numero, atualizadaEm: c.atualizadaEm ?? c.criadaEm },
          mensagens: c.mensagens,
        }
      : null;
  }
  const { data: c, error } = await db.from("conversas").select("id, status, ficha, numero, atualizada_em").eq("id", id).maybeSingle();
  falhou("ler a conversa", error);
  if (!c) return null;
  const { data: ms, error: e2 } = await db
    .from("mensagens")
    .select("papel, conteudo, texto")
    .eq("conversa_id", id)
    .order("id", { ascending: true });
  falhou("ler as mensagens", e2);
  return {
    conversa: {
      id: c.id,
      status: c.status,
      ficha: { ...fichaVazia(), ...(c.ficha ?? {}) },
      numero: c.numero,
      atualizadaEm: c.atualizada_em,
    },
    mensagens: (ms ?? []) as MensagemSalva[],
  };
}

export async function criarConversa(id: string, meta: Meta): Promise<Conversa> {
  const conversa: Conversa = { id, status: "rascunho", ficha: fichaVazia(), numero: null, atualizadaEm: agora() };
  const db = supabase();
  if (!db) {
    await gravarLocal({ ...conversa, meta, criadaEm: agora(), mensagens: [] });
    return conversa;
  }
  const { error } = await db.from("conversas").insert({
    id,
    ficha: conversa.ficha,
    origem: meta.origem,
    utm: meta.utm,
    dispositivo: meta.dispositivo,
    visitante: meta.visitante,
  });
  falhou("criar a conversa", error);
  return conversa;
}

/** Grava mensagens na hora em que acontecem: a conversa fica salva mesmo se o cliente sair sem enviar. */
export async function anexarMensagens(id: string, novas: MensagemSalva[]) {
  const db = supabase();
  if (!db) {
    const c = await lerLocal(id);
    if (!c) return;
    c.mensagens.push(...novas);
    c.atualizadaEm = agora();
    await gravarLocal(c);
    return;
  }
  const { error } = await db
    .from("mensagens")
    .insert(novas.map((m) => ({ conversa_id: id, papel: m.papel, conteudo: m.conteudo, texto: m.texto })));
  falhou("salvar mensagens", error);
  const { error: e2 } = await db.from("conversas").update({ atualizada_em: new Date().toISOString() }).eq("id", id);
  falhou("atualizar a conversa", e2);
}

export async function salvarFicha(id: string, ficha: Ficha) {
  const db = supabase();
  if (!db) {
    const c = await lerLocal(id);
    if (!c) return;
    c.ficha = ficha;
    c.atualizadaEm = agora();
    await gravarLocal(c);
    return;
  }
  const { error } = await db
    .from("conversas")
    .update({ ficha, valor_minimo: valorMinimo(ficha), atualizada_em: new Date().toISOString() })
    .eq("id", id);
  falhou("salvar a ficha", error);
}

export async function confirmarPedido(id: string, aceitaNovidades: boolean, versaoConsentimento: string) {
  const numero = Date.now().toString(36).toUpperCase().slice(-6);
  const em = new Date().toISOString();
  const db = supabase();
  if (!db) {
    const c = await lerLocal(id);
    if (!c) return null;
    Object.assign(c, { status: "enviado", numero, enviadaEm: em, aceitaNovidades });
    await gravarLocal(c);
    return numero;
  }
  const { error } = await db
    .from("conversas")
    .update({
      status: "enviado",
      numero,
      enviada_em: em,
      atualizada_em: em,
      aceita_novidades: aceitaNovidades,
      // prova do consentimento para ofertas (LGPD art. 8º): o quê, quando e qual versão do texto
      consentimento: aceitaNovidades ? { finalidade: "ofertas", versao: versaoConsentimento, em } : null,
    })
    .eq("id", id);
  falhou("confirmar o pedido", error);
  return numero;
}

/* ---------- área administrativa (só com Supabase) ---------- */

export type Avaliacao = {
  /** 0 a 100: chance de fechar e tamanho da oportunidade. */
  nota: number;
  temperatura: "quente" | "morno" | "frio";
  resumo: string;
  pontos_fortes: string[];
  alertas: string[];
  proximo_passo: string;
  /** Primeira mensagem sugerida para mandar ao cliente no WhatsApp. */
  mensagem_sugerida: string;
};

export type Situacao = "conversando" | "abandonado" | "enviado";

export type LeadResumo = {
  id: string;
  situacao: Situacao;
  numero: string | null;
  atualizadaEm: string;
  nome: string | null;
  whatsapp: string | null;
  email: string | null;
  negocio: string | null;
  cidade: string | null;
  valorMinimo: number | null;
  mensagensDoCliente: number;
  nota: number | null;
  temperatura: Avaliacao["temperatura"] | null;
  resumo: string | null;
};

export type LeadCompleto = {
  id: string;
  situacao: Situacao;
  numero: string | null;
  criadaEm: string;
  atualizadaEm: string;
  enviadaEm: string | null;
  ficha: Ficha;
  valorMinimo: number;
  aceitaNovidades: boolean;
  origem: string | null;
  utm: Record<string, string>;
  dispositivo: string | null;
  avaliacao: Avaliacao | null;
  avaliadaEm: string | null;
  notificadaEm: string | null;
  emailClienteEm: string | null;
  mensagens: { papel: "cliente" | "ia"; texto: string; em: string }[];
};

function exigirSupabase() {
  const db = supabase();
  if (!db) throw new Error("A área administrativa precisa do Supabase: preencha SUPABASE_URL e SUPABASE_SECRET_KEY.");
  return db;
}

const situacaoDe = (status: string, atualizada: string): Situacao =>
  status === "enviado" ? "enviado" : Date.now() - new Date(atualizada).getTime() > 30 * 60_000 ? "abandonado" : "conversando";

/** Lista os contatos mais recentes, inclusive quem desistiu no meio. Conversas sem nenhuma mensagem ficam de fora. */
export async function listarLeads(limite = 300): Promise<LeadResumo[]> {
  const { data, error } = await exigirSupabase()
    .from("painel_pedidos")
    .select(
      "id, situacao, numero, atualizada_em, nome, whatsapp, email, negocio, cidade, valor_minimo, mensagens_do_cliente, nota, temperatura, resumo",
    )
    .gt("mensagens_do_cliente", 0)
    .limit(limite);
  falhou("listar os contatos", error);
  return (data ?? []).map((l) => ({
    id: l.id,
    situacao: l.situacao,
    numero: l.numero,
    atualizadaEm: l.atualizada_em,
    nome: l.nome,
    whatsapp: l.whatsapp,
    email: l.email,
    negocio: l.negocio,
    cidade: l.cidade,
    valorMinimo: l.valor_minimo,
    mensagensDoCliente: Number(l.mensagens_do_cliente),
    nota: l.nota,
    temperatura: l.temperatura,
    resumo: l.resumo,
  }));
}

export async function obterLead(id: string): Promise<LeadCompleto | null> {
  const db = exigirSupabase();
  const { data: c, error } = await db
    .from("conversas")
    .select(
      "id, status, numero, criada_em, atualizada_em, enviada_em, ficha, aceita_novidades, origem, utm, dispositivo, avaliacao, avaliada_em, notificada_em, email_cliente_em",
    )
    .eq("id", id)
    .maybeSingle();
  falhou("ler o contato", error);
  if (!c) return null;
  const { data: ms, error: e2 } = await db
    .from("mensagens")
    .select("papel, texto, criada_em")
    .eq("conversa_id", id)
    .not("texto", "is", null)
    .order("id", { ascending: true });
  falhou("ler as mensagens", e2);
  const ficha: Ficha = { ...fichaVazia(), ...(c.ficha ?? {}) };
  return {
    id: c.id,
    situacao: situacaoDe(c.status, c.atualizada_em),
    numero: c.numero,
    criadaEm: c.criada_em,
    atualizadaEm: c.atualizada_em,
    enviadaEm: c.enviada_em,
    ficha,
    valorMinimo: valorMinimo(ficha),
    aceitaNovidades: c.aceita_novidades,
    origem: c.origem,
    utm: c.utm ?? {},
    dispositivo: c.dispositivo,
    avaliacao: c.avaliacao,
    avaliadaEm: c.avaliada_em,
    notificadaEm: c.notificada_em,
    emailClienteEm: c.email_cliente_em,
    mensagens: (ms ?? []).map((m) => ({ papel: m.papel === "user" ? "cliente" : "ia", texto: m.texto as string, em: m.criada_em })),
  };
}

export async function salvarAvaliacao(id: string, avaliacao: Avaliacao) {
  const { error } = await exigirSupabase()
    .from("conversas")
    .update({ avaliacao, avaliada_em: new Date().toISOString() })
    .eq("id", id);
  falhou("salvar a avaliação", error);
}

/**
 * Qual e-mail: o aviso de pedido para você (notificada_em), a confirmação para o cliente (email_cliente_em)
 * ou o aviso de novo contato, antes do pedido (contato_avisado_em, supabase/004_aviso_contato.sql).
 */
export type CampoEmail = "notificada_em" | "email_cliente_em" | "contato_avisado_em";

/**
 * Reserva o envio de um e-mail deste lead. Devolve true só para quem conseguiu reservar,
 * assim duas confirmações simultâneas não mandam o mesmo e-mail duas vezes.
 */
export async function reservarEmail(id: string, campo: CampoEmail) {
  const { data, error } = await exigirSupabase()
    .from("conversas")
    .update({ [campo]: new Date().toISOString() })
    .eq("id", id)
    .is(campo, null)
    .select("id");
  falhou("reservar o e-mail", error);
  return (data ?? []).length > 0;
}

/** Libera a reserva quando o envio falhou, para tentar de novo pela área administrativa. */
export async function liberarEmail(id: string, campo: CampoEmail) {
  const { error } = await exigirSupabase().from("conversas").update({ [campo]: null }).eq("id", id);
  falhou("liberar o e-mail", error);
}

/* ---------- pagamento, domínio e site (supabase/005_pagamento_site.sql) ---------- */

export type EstadoPedido = {
  id: string;
  numero: string | null;
  status: string;
  ficha: Ficha;
  valorCobrado: number | null;
  mpLink: string | null;
  pagamentoStatus: "aguardando" | "aprovado" | "recusado" | "estornado" | null;
  pagoEm: string | null;
  dominio: string | null;
  dominioStatus: "livre" | "ocupado" | "do_cliente" | "apontado" | "indefinido" | null;
  siteSlug: string | null;
  siteStatus: "na_fila" | "gerando" | "publicado" | "erro" | null;
  siteUrl: string | null;
  geracaoDisparadaEm: string | null;
};

export async function obterEstadoPedido(id: string): Promise<EstadoPedido | null> {
  const { data: c, error } = await exigirSupabase()
    .from("conversas")
    .select(
      "id, numero, status, ficha, valor_cobrado, mp_link, pagamento_status, pago_em, dominio, dominio_status, site_slug, site_status, site_url, geracao_disparada_em",
    )
    .eq("id", id)
    .maybeSingle();
  falhou("ler o pedido", error);
  if (!c) return null;
  return {
    id: c.id,
    numero: c.numero,
    status: c.status,
    ficha: { ...fichaVazia(), ...(c.ficha ?? {}) },
    valorCobrado: c.valor_cobrado,
    mpLink: c.mp_link,
    pagamentoStatus: c.pagamento_status,
    pagoEm: c.pago_em,
    dominio: c.dominio,
    dominioStatus: c.dominio_status,
    siteSlug: c.site_slug,
    siteStatus: c.site_status,
    siteUrl: c.site_url,
    geracaoDisparadaEm: c.geracao_disparada_em,
  };
}

/** Grava o link de pagamento, o domínio pedido e o endereço provisório reservado. */
export async function salvarCobranca(
  id: string,
  c: { valor: number; preferencia: string; link: string; dominio: string | null; dominioStatus: string | null; slug: string },
) {
  const { error } = await exigirSupabase()
    .from("conversas")
    .update({
      valor_cobrado: c.valor,
      mp_preferencia: c.preferencia,
      mp_link: c.link,
      pagamento_status: "aguardando",
      dominio: c.dominio,
      dominio_status: c.dominioStatus,
      site_slug: c.slug,
    })
    .eq("id", id);
  falhou("salvar a cobrança", error);
}

/** O endereço provisório já está em uso por outro pedido? */
export async function slugEmUso(slug: string) {
  const { data, error } = await exigirSupabase().from("conversas").select("id").eq("site_slug", slug).limit(1);
  falhou("conferir o endereço", error);
  return (data ?? []).length > 0;
}

/**
 * Marca como pago. Devolve true só na primeira vez (o Mercado Pago repete avisos),
 * para o site ser gerado uma única vez.
 */
export async function marcarPago(id: string, pagamentoId: string) {
  const { data, error } = await exigirSupabase()
    .from("conversas")
    .update({ pagamento_status: "aprovado", mp_pagamento_id: pagamentoId, pago_em: new Date().toISOString() })
    .eq("id", id)
    .or("pagamento_status.is.null,pagamento_status.neq.aprovado")
    .select("id");
  falhou("marcar o pagamento", error);
  return (data ?? []).length > 0;
}

export async function marcarPagamento(id: string, status: "recusado" | "estornado", pagamentoId: string) {
  const { error } = await exigirSupabase()
    .from("conversas")
    .update({ pagamento_status: status, mp_pagamento_id: pagamentoId })
    .eq("id", id)
    .or(
      status === "recusado"
        ? "pagamento_status.is.null,pagamento_status.eq.aguardando" // uma tentativa recusada não desfaz um pagamento aprovado
        : "pagamento_status.eq.aprovado",
    );
  falhou("atualizar o pagamento", error);
}

/** Reserva o disparo da geração. True só para quem reservou primeiro. */
/** Reserva o e-mail de "site no ar". True só na primeira vez. */
export async function reservarAvisoSite(id: string) {
  const { data, error } = await exigirSupabase()
    .from("conversas")
    .update({ site_avisado_em: new Date().toISOString() })
    .eq("id", id)
    .eq("site_status", "publicado")
    .is("site_avisado_em", null)
    .select("id");
  falhou("reservar o aviso do site", error);
  return (data ?? []).length > 0;
}

export async function reservarGeracao(id: string) {
  const { data, error } = await exigirSupabase()
    .from("conversas")
    .update({ geracao_disparada_em: new Date().toISOString(), site_status: "na_fila" })
    .eq("id", id)
    .is("geracao_disparada_em", null)
    .select("id");
  falhou("reservar a geração", error);
  return (data ?? []).length > 0;
}

export async function liberarGeracao(id: string, obs: string) {
  const { error } = await exigirSupabase()
    .from("conversas")
    .update({ geracao_disparada_em: null, site_status: "erro", site_obs: obs.slice(0, 1000) })
    .eq("id", id);
  falhou("liberar a geração", error);
}

