import { siteDoEndereco, usandoArquivoLocal } from "@/lib/db";

/**
 * Serve as landing pages geradas. O next.config reescreve para cá todo acesso que chega por
 * <slug>.kriai.online ou pelo domínio próprio do cliente (tudo que não é www.kriai.online).
 */
export async function GET(request: Request) {
  const host = request.headers.get("x-forwarded-host") ?? request.headers.get("host") ?? "";
  if (usandoArquivoLocal()) return new Response("Sites gerados só funcionam com o Supabase.", { status: 404 });
  const site = await siteDoEndereco(host).catch(() => null);
  if (!site) {
    return new Response(
      `<!doctype html><html lang="pt-BR"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Site em preparação</title><body style="font-family:system-ui,sans-serif;display:grid;place-items:center;min-height:100vh;margin:0;padding:24px;text-align:center"><div><h1 style="font-size:22px">Este site está sendo preparado.</h1><p>Volte em alguns minutos. Feito pela <a href="https://www.kriai.online">Kriai</a>.</p></div></body></html>`,
      { status: 404, headers: { "Content-Type": "text/html; charset=utf-8", "Cache-Control": "no-store" } },
    );
  }
  return new Response(site.html, {
    headers: {
      "Content-Type": "text/html; charset=utf-8",
      "Cache-Control": "public, max-age=0, s-maxage=60, stale-while-revalidate=600",
      "X-Content-Type-Options": "nosniff",
    },
  });
}
