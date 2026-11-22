import "server-only";

// Dispara a sessão agendada do Claude que gera e publica o site do cliente.
// Variáveis na Vercel (copiadas da tela da sessão agendada, em claude.ai/code/routines > gatilho API):
//   KRIAI_ROTINA_URL   → https://api.anthropic.com/v1/claude_code/routines/<id>/fire
//   KRIAI_ROTINA_TOKEN → token sk-ant-oat01-... gerado no mesmo lugar
// O endpoint não tem chave de idempotência: quem chama esta função precisa garantir um disparo só por pedido.

export const geracaoLigada = () => !!process.env.KRIAI_ROTINA_URL && !!process.env.KRIAI_ROTINA_TOKEN;

export async function dispararGeracao(p: { conversaId: string; numero: string; slug: string; baseUrl: string }) {
  const url = process.env.KRIAI_ROTINA_URL;
  const tokenRotina = process.env.KRIAI_ROTINA_TOKEN;
  if (!url || !tokenRotina) throw new Error("KRIAI_ROTINA_URL ou KRIAI_ROTINA_TOKEN não configurados");
  const r = await fetch(url, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${tokenRotina}`,
      "anthropic-version": "2023-06-01",
      "anthropic-beta": "experimental-cc-routine-2026-04-01",
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      text: [
        `Pedido pago: nº ${p.numero}`,
        `conversa_id: ${p.conversaId}`,
        `slug: ${p.slug}`,
        `endereco_provisorio: https://${p.slug}.kriai.online`,
        `retorno: ${p.baseUrl}/api/site/status`,
      ].join("\n"),
    }),
  });
  if (!r.ok) throw new Error(`Sessão agendada respondeu ${r.status}: ${await r.text()}`);
  const d = await r.json().catch(() => ({}));
  return (d.claude_code_session_url as string | undefined) ?? null;
}
