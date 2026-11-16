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
  sb ??= createClient(URL_SB, CHAVE_SB, { auth: { persistSession: false } });
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
