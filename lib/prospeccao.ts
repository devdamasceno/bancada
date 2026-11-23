import "server-only";
import { exigirSupabase } from "@/lib/db";

// Prospecção ativa no Google Maps (Perfil da Empresa) com a Places API (New).
// Chave: GOOGLE_PLACES_API_KEY na Vercel. Cada busca lê até 60 empresas (3 páginas de 20),
// descarta as que não servem, pontua as outras e guarda as 10 melhores que ainda não estavam salvas.

const API = "https://places.googleapis.com/v1/places:searchText";
const CAMPOS = [
  "places.id",
  "places.displayName",
  "places.formattedAddress",
  "places.nationalPhoneNumber",
  "places.internationalPhoneNumber",
  "places.websiteUri",
  "places.googleMapsUri",
  "places.businessStatus",
  "places.rating",
  "places.userRatingCount",
  "places.reviews",
  "nextPageToken",
].join(",");

export const STATUS_PROSPECT = ["novo", "contatado", "interessado", "descartado", "cliente"] as const;
export type StatusProspect = (typeof STATUS_PROSPECT)[number];

export type Prospect = {
  place_id: string;
  nome: string;
  segmento: string;
  local: string;
  endereco: string | null;
  telefone: string | null;
  celular: boolean;
  site: string | null;
  instagram: string | null;
  maps_url: string | null;
  nota_google: number | null;
  avaliacoes: number | null;
  ultima_atividade: string | null;
  pontuacao: number;
  motivos: string[];
  status: StatusProspect;
  observacao: string | null;
  criado_em: string;
};

type Lugar = {
  id: string;
  displayName?: { text: string };
  formattedAddress?: string;
  nationalPhoneNumber?: string;
  internationalPhoneNumber?: string;
  websiteUri?: string;
  googleMapsUri?: string;
  businessStatus?: string;
  rating?: number;
  userRatingCount?: number;
  reviews?: { publishTime?: string }[];
};

/** Site que na verdade é rede social ou link de bio: conta como "sem site próprio". */
const REDE = /(^|\.)(instagram\.com|instagr\.am|facebook\.com|fb\.com|linktr\.ee|wa\.me|api\.whatsapp\.com|whatsapp\.com|tiktok\.com|ifood\.com\.br|bio\.link|beacons\.ai|linkbio|taplink)/i;

function analisarSite(uri?: string) {
  if (!uri) return { proprio: null as string | null, instagram: null as string | null, rede: false };
  let host = "";
  try {
    host = new URL(uri).hostname.replace(/^www\./, "");
  } catch {
    return { proprio: null, instagram: null, rede: false };
  }
  const instagram = /(^|\.)(instagram\.com|instagr\.am)$/i.test(host) ? uri : null;
  if (REDE.test(host)) return { proprio: null, instagram, rede: true };
  return { proprio: uri, instagram: null, rede: false };
}

/** Celular brasileiro (WhatsApp provável): DDD + 9 + 8 dígitos. */
function ehCelular(tel?: string) {
  const d = (tel ?? "").replace(/\D/g, "").replace(/^55/, "");
  return d.length === 11 && d[2] === "9";
}

const DIA = 86_400_000;

/**
 * Pontuação de 0 a 100. Regras de corte: precisa estar funcionando, ter telefone e não ter site próprio.
 * Atividade: o Google não informa a data de criação nem da última edição do perfil, então usamos
 * a avaliação mais recente como sinal de que o perfil está vivo, e poucas avaliações como sinal de negócio novo.
 */
export function pontuar(l: Lugar) {
  if (l.businessStatus && l.businessStatus !== "OPERATIONAL") return null;
  const telefone = l.nationalPhoneNumber ?? l.internationalPhoneNumber;
  if (!telefone) return null;
  const site = analisarSite(l.websiteUri);
  if (site.proprio) return null;

  const motivos: string[] = [];
  let p = 0;
  p += 30;
  motivos.push(site.rede ? "Usa rede social no lugar de site" : "Sem site");
  p += 20;
  motivos.push("Telefone no perfil");
  const celular = ehCelular(l.nationalPhoneNumber ?? l.internationalPhoneNumber);
  if (celular) {
    p += 10;
    motivos.push("Celular (WhatsApp provável)");
  }
  if (site.instagram) {
    p += 15;
    motivos.push("Instagram no perfil");
  }

  const datas = (l.reviews ?? []).map((r) => Date.parse(r.publishTime ?? "")).filter((n) => !Number.isNaN(n));
  const ultima = datas.length ? Math.max(...datas) : null;
  const dias = ultima ? (Date.now() - ultima) / DIA : null;
  if (dias !== null && dias <= 30) {
    p += 15;
    motivos.push("Avaliação nos últimos 30 dias");
  } else if (dias !== null && dias <= 90) {
    p += 10;
    motivos.push("Avaliação nos últimos 3 meses");
  } else if (dias !== null && dias <= 180) {
    p += 5;
    motivos.push("Avaliação nos últimos 6 meses");
  }
  const n = l.userRatingCount ?? 0;
  if (n > 0 && n <= 40) {
    p += 5;
    motivos.push("Perfil recente (poucas avaliações)");
  } else if (n === 0) {
    p += 3;
    motivos.push("Perfil novo (sem avaliações)");
  }
  if ((l.rating ?? 0) >= 4.3) {
    p += 5;
    motivos.push(`Bem avaliado (${l.rating?.toFixed(1)})`);
  }

  return {
    nome: l.displayName?.text ?? "Sem nome",
    endereco: l.formattedAddress ?? null,
    telefone,
    celular,
    site: l.websiteUri ?? null,
    instagram: site.instagram,
    maps_url: l.googleMapsUri ?? null,
    nota_google: l.rating ?? null,
    avaliacoes: l.userRatingCount ?? null,
    ultima_atividade: ultima ? new Date(ultima).toISOString() : null,
    pontuacao: Math.min(100, p),
    motivos,
  };
}

async function buscarPagina(texto: string, token?: string) {
  const chave = process.env.GOOGLE_PLACES_API_KEY;
  if (!chave) throw new Error("GOOGLE_PLACES_API_KEY não configurada na Vercel.");
  const r = await fetch(API, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Goog-Api-Key": chave, "X-Goog-FieldMask": CAMPOS },
    body: JSON.stringify({ textQuery: texto, languageCode: "pt-BR", regionCode: "BR", pageSize: 20, ...(token ? { pageToken: token } : {}) }),
    cache: "no-store",
  });
  if (!r.ok) {
    const corpo = await r.text();
    throw new Error(`Google Places respondeu ${r.status}: ${corpo.slice(0, 300)}`);
  }
  return (await r.json()) as { places?: Lugar[]; nextPageToken?: string };
}

export type ResultadoBusca = { lidos: number; aproveitados: number; novos: number; jaSalvos: number };

/** Busca ativa: lê até 60 empresas, filtra, pontua e salva as 10 melhores que ainda não estavam na base. */
export async function prospectar(segmento: string, local: string, quantidade = 10): Promise<ResultadoBusca> {
  const seg = segmento.trim().slice(0, 80);
  const loc = local.trim().slice(0, 80);
  if (!seg || !loc) throw new Error("Informe o segmento e o local.");
  const texto = `${seg} em ${loc}`;

  const lugares: Lugar[] = [];
  let token: string | undefined;
  for (let pagina = 0; pagina < 3; pagina++) {
    const r = await buscarPagina(texto, token);
    lugares.push(...(r.places ?? []));
    token = r.nextPageToken;
    if (!token) break;
    await new Promise((ok) => setTimeout(ok, 1500)); // o token da próxima página demora um pouco para valer
  }

  const db = exigirSupabase();
  const ids = lugares.map((l) => l.id);
  const { data: existentes, error: e1 } = await db.from("prospects").select("place_id").in("place_id", ids.length ? ids : ["-"]);
  if (e1) throw new Error(`Não consegui ler a base: ${e1.message}`);
  const salvos = new Set((existentes ?? []).map((x) => x.place_id as string));

  const avaliados = lugares
    .map((l) => ({ id: l.id, p: pontuar(l) }))
    .filter((x): x is { id: string; p: NonNullable<ReturnType<typeof pontuar>> } => !!x.p);
  const novos = avaliados
    .filter((x) => !salvos.has(x.id))
    .sort((a, b) => b.p.pontuacao - a.p.pontuacao || Date.parse(b.p.ultima_atividade ?? "0") - Date.parse(a.p.ultima_atividade ?? "0"))
    .slice(0, quantidade);

  if (novos.length) {
    const { error } = await db.from("prospects").insert(novos.map((x) => ({ place_id: x.id, segmento: seg, local: loc, ...x.p })));
    if (error) throw new Error(`Não consegui salvar: ${error.message}`);
  }
  return { lidos: lugares.length, aproveitados: avaliados.length, novos: novos.length, jaSalvos: avaliados.length - avaliados.filter((x) => !salvos.has(x.id)).length };
}

export async function listarProspects(f: { segmento?: string; local?: string; status?: string }) {
  let q = exigirSupabase().from("prospects").select("*").order("pontuacao", { ascending: false }).order("criado_em", { ascending: false }).limit(1000);
  if (f.segmento) q = q.ilike("segmento", `%${f.segmento}%`);
  if (f.local) q = q.ilike("local", `%${f.local}%`);
  if (f.status && (STATUS_PROSPECT as readonly string[]).includes(f.status)) q = q.eq("status", f.status);
  const { data, error } = await q;
  if (error) throw new Error(error.message);
  return (data ?? []) as Prospect[];
}

export async function mudarStatusProspect(placeId: string, status: StatusProspect) {
  const { error } = await exigirSupabase().from("prospects").update({ status, atualizado_em: new Date().toISOString() }).eq("place_id", placeId);
  if (error) throw new Error(error.message);
}

/* ---------- modo abordagem ---------- */

const DIAS_ACOMPANHAR = 2;

export type ItemFila = Prospect & { etapa: "primeira" | "acompanhamento"; tentativas: number; contatado_em: string | null };

/** Fila do dia: primeiro os acompanhamentos vencidos, depois os novos por pontuação. Pulados vão para o fim. */
export async function filaAbordagem(f: { segmento?: string; local?: string }) {
  const db = exigirSupabase();
  const limite = new Date(Date.now() - DIAS_ACOMPANHAR * DIA).toISOString();
  // começo do dia em Brasília (UTC-3)
  const inicioDia = new Date(Math.floor((Date.now() - 3 * 3600_000) / DIA) * DIA + 3 * 3600_000).toISOString();
  let qAcomp = db.from("prospects").select("*").eq("status", "contatado").eq("tentativas", 1).lte("contatado_em", limite);
  let qNovos = db.from("prospects").select("*").eq("status", "novo");
  if (f.segmento) {
    qAcomp = qAcomp.ilike("segmento", `%${f.segmento}%`);
    qNovos = qNovos.ilike("segmento", `%${f.segmento}%`);
  }
  if (f.local) {
    qAcomp = qAcomp.ilike("local", `%${f.local}%`);
    qNovos = qNovos.ilike("local", `%${f.local}%`);
  }
  const [acomp, novos, hoje] = await Promise.all([
    qAcomp.order("contatado_em", { ascending: true }).limit(50),
    qNovos.order("pulado_em", { ascending: true, nullsFirst: true }).order("pontuacao", { ascending: false }).limit(50),
    db.from("prospects").select("place_id", { count: "exact", head: true }).gte("contatado_em", inicioDia),
  ]);
  if (acomp.error) throw new Error(acomp.error.message);
  if (novos.error) throw new Error(novos.error.message);
  const fila: ItemFila[] = [
    ...(acomp.data ?? []).map((p) => ({ ...(p as ItemFila), etapa: "acompanhamento" as const })),
    ...(novos.data ?? []).map((p) => ({ ...(p as ItemFila), etapa: "primeira" as const })),
  ];
  return { fila, enviadosHoje: hoje.count ?? 0 };
}

/** Exemplo do portfólio que combina com o segmento. */
export function exemploDoSegmento(segmento: string) {
  const s = segmento.toLowerCase();
  if (/personal|academia|treino|fitness|crossfit|pilates/.test(s)) return "https://personal.kriai.online";
  if (/barbe|salão|salao|cabel|beleza|estética|estetica|unha|manicure/.test(s)) return "https://barbearia.kriai.online";
  if (/bolo|confeit|doce|padaria|café|cafe|brigadeiro/.test(s)) return "https://bolos.kriai.online";
  if (/fisio|clínica|clinica|consult|dent|odonto|psic|nutri|terapia|saúde|saude/.test(s)) return "https://fisio.kriai.online";
  if (/pizz|restaurante|lanch|hamburg|delivery|comida|marmit|açaí|acai/.test(s)) return "https://pizzaria.kriai.online";
  if (/consórcio|consorcio|seguro|corretor|financ/.test(s)) return "https://joaobala.kriai.online";
  return "https://www.kriai.online/portfolio";
}

/** Abordagem sem oferta: só puxa conversa. Preço e exemplo entram depois que a pessoa responder. */
export function mensagemAbordagem(p: Pick<Prospect, "nome" | "segmento" | "local">, etapa: "primeira" | "acompanhamento") {
  const cidade = p.local.split(",")[0].trim();
  if (etapa === "acompanhamento") {
    return `Oi, pessoal da ${p.nome}! Passando de novo para saber se conseguem me responder. Se não for um bom momento, tudo bem, obrigado mesmo assim! 😊`;
  }
  return `Oi, tudo bem? Aqui é o Sérgio, da Kriai. Encontrei a ${p.nome} no Google procurando ${p.segmento} em ${cidade}. Posso fazer uma pergunta rápida sobre como os clientes chegam até vocês hoje?`;
}

export async function registrarEnvio(placeId: string) {
  const db = exigirSupabase();
  const { data, error } = await db.from("prospects").select("tentativas, status").eq("place_id", placeId).maybeSingle();
  if (error || !data) throw new Error(error?.message ?? "Lead não encontrado");
  const agora = new Date().toISOString();
  const { error: e2 } = await db
    .from("prospects")
    .update({
      tentativas: (data.tentativas ?? 0) + 1,
      contatado_em: agora,
      status: data.status === "novo" ? "contatado" : data.status,
      atualizado_em: agora,
    })
    .eq("place_id", placeId);
  if (e2) throw new Error(e2.message);
}

export async function pularProspect(placeId: string) {
  const { error } = await exigirSupabase().from("prospects").update({ pulado_em: new Date().toISOString() }).eq("place_id", placeId);
  if (error) throw new Error(error.message);
}
