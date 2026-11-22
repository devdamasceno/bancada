import { servicos, type ServicoId } from "@/content/site";

/** Ficha do pedido, preenchida pela IA durante a conversa. Usada no servidor e no navegador. */
export type Ficha = {
  servicos: ServicoId[];
  negocio?: string;
  cidade?: string;
  objetivo?: string;
  ja_tem?: string;
  prazo?: string;
  investimento?: string;
  nome?: string;
  whatsapp?: string;
  email?: string;
  /** Domínio que a pessoa quer (ex.: barbeariaesquina.com.br). Só faz sentido para site. */
  dominio?: string;
  observacoes?: string;
};

export const CAMPOS_TEXTO = [
  "negocio",
  "cidade",
  "objetivo",
  "ja_tem",
  "prazo",
  "investimento",
  "nome",
  "whatsapp",
  "email",
  "dominio",
  "observacoes",
] as const;
export type CampoTexto = (typeof CAMPOS_TEXTO)[number];

/** Campos que contam no progresso "x de 10" (domínio e observações são extras). */
export const CAMPOS_PROGRESSO = [
  "servicos",
  ...CAMPOS_TEXTO.filter((c): c is Exclude<CampoTexto, "observacoes" | "dominio"> => c !== "observacoes" && c !== "dominio"),
] as const;

const IDS = new Set<string>(servicos.map((s) => s.id));

export const fichaVazia = (): Ficha => ({ servicos: [] });

export function valorMinimo(f: Ficha) {
  return servicos.filter((s) => f.servicos.includes(s.id)).reduce((t, s) => t + s.aPartirDe, 0);
}

export function camposPreenchidos(f: Ficha) {
  return CAMPOS_PROGRESSO.filter((c) => (c === "servicos" ? f.servicos.length > 0 : !!f[c])).length;
}

/** Mínimo para enviar: um serviço, nome e um contato. */
export function prontaParaEnviar(f: Ficha) {
  return f.servicos.length > 0 && !!f.nome && (!!f.whatsapp || !!f.email);
}

/**
 * Valida a entrada da ferramenta `atualizar_ficha` (vinda da IA, portanto não confiável).
 * Devolve só os campos válidos, ou null se a entrada não for um objeto.
 */
export function validarAtualizacao(entrada: unknown): Partial<Ficha> | null {
  if (!entrada || typeof entrada !== "object" || Array.isArray(entrada)) return null;
  const e = entrada as Record<string, unknown>;
  const saida: Partial<Ficha> = {};
  if ("servicos" in e) {
    if (!Array.isArray(e.servicos)) return null;
    saida.servicos = [...new Set(e.servicos.filter((s): s is ServicoId => typeof s === "string" && IDS.has(s)))];
  }
  for (const c of CAMPOS_TEXTO) {
    if (!(c in e)) continue;
    if (typeof e[c] !== "string") return null;
    const v = (e[c] as string).trim().slice(0, c === "observacoes" ? 1000 : 200);
    // marcação vazada da chamada da ferramenta (ex.: "<parameter name=...>") invalida a entrada; a IA reenvia
    if (/<\/?[a-z][\w:-]*(\s[^>]*)?>/i.test(v)) return null;
    if (v) saida[c] = v;
  }
  return saida;
}

export function mesclar(atual: Ficha, novo: Partial<Ficha>): Ficha {
  const r: Ficha = { ...atual, ...novo, servicos: novo.servicos ?? atual.servicos };
  if (novo.observacoes && atual.observacoes && !atual.observacoes.includes(novo.observacoes)) {
    r.observacoes = `${atual.observacoes}\n${novo.observacoes}`.slice(-2000);
  }
  return r;
}

/** Pedido que segue sozinho: só o site de 1 página, pago na hora pelo Mercado Pago e gerado automaticamente. */
export const pagamentoAutomatico = (f: Ficha) => f.servicos.length === 1 && f.servicos[0] === "site";
