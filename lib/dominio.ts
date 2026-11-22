import "server-only";

export type DominioVerificado = { dominio: string; status: "livre" | "ocupado" | "indefinido" };

/** Limpa o que a pessoa digitou ("www.Barbearia Esquina.com.br/" → "barbeariaesquina.com.br"). Null se não parecer domínio. */
export function normalizarDominio(texto?: string | null) {
  if (!texto) return null;
  let d = texto
    .trim()
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/^https?:\/\//, "")
    .replace(/^www\./, "")
    .replace(/\/.*$/, "")
    .replace(/\s+/g, "");
  if (!d.includes(".")) d = `${d}.com.br`;
  return /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?(\.[a-z]{2,})+$/.test(d) ? d : null;
}

/**
 * Domínio livre? Usa o RDAP público: o Registro.br para .br e o rdap.org (que redireciona ao registro certo) para o resto.
 * 404 = ninguém registrou. Qualquer falha vira "indefinido", nunca "livre".
 */
export async function verificarDominio(dominio: string): Promise<DominioVerificado> {
  const base = dominio.endsWith(".br") ? "https://rdap.registro.br/domain/" : "https://rdap.org/domain/";
  try {
    const r = await fetch(base + encodeURIComponent(dominio), {
      headers: { Accept: "application/rdap+json" },
      cache: "no-store",
      signal: AbortSignal.timeout(6000),
    });
    if (r.status === 404) return { dominio, status: "livre" };
    if (r.ok) return { dominio, status: "ocupado" };
    return { dominio, status: "indefinido" };
  } catch {
    return { dominio, status: "indefinido" };
  }
}

/** Endereço provisório: <slug>.kriai.online. Só letras, números e hífen. */
export function criarSlug(texto: string) {
  return (
    texto
      .toLowerCase()
      .normalize("NFD")
      .replace(/[̀-ͯ]/g, "")
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-+|-+$/g, "")
      .slice(0, 40)
      .replace(/-+$/g, "") || "cliente"
  );
}
