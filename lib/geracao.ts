import "server-only";
import { notificarSitePublicado } from "@/lib/automacao";
import { pegarGeracao, reservarAvisoSite } from "@/lib/db";
import { gerarSite } from "@/lib/gerador";

/**
 * Gera o site de um pedido pago e avisa o cliente. Uma geração por vez por pedido (trava no banco).
 * Roda dentro de uma função com tempo longo (/api/site/gerar ou ação do painel).
 */
export async function gerarEAvisar(id: string, base: string) {
  if (!(await pegarGeracao(id))) return { ok: false as const, motivo: "ja_gerando_ou_publicado" };
  const url = await gerarSite(id);
  if (await reservarAvisoSite(id)) await notificarSitePublicado(id, base);
  return { ok: true as const, url };
}

/** Pede ao próprio site para gerar (em outra função, com tempo próprio), sem esperar o fim. */
export async function pedirGeracao(id: string, base: string) {
  const segredo = process.env.KRIAI_AUTOMACAO_SEGREDO;
  if (!segredo) throw new Error("KRIAI_AUTOMACAO_SEGREDO não configurado");
  const r = await fetch(`${base}/api/site/gerar`, {
    method: "POST",
    headers: { Authorization: `Bearer ${segredo}`, "Content-Type": "application/json" },
    body: JSON.stringify({ conversaId: id }),
  });
  if (!r.ok && r.status !== 409) throw new Error(`/api/site/gerar respondeu ${r.status}`);
}
