import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { marca } from "@/content/site";
import { mensagensDaConversa, obterEstadoPedido, salvarSiteGerado, marcarSite } from "@/lib/db";

// Gera a landing page do cliente com a API do Claude, a partir do que a Kria combinou na conversa.
// O HTML fica no Supabase (tabela sites) e é servido em https://<slug>.kriai.online (app/api/s/route.ts).
// Modelo: variável ANTHROPIC_MODEL_SITE (padrão: Sonnet 5.5, rápido o bastante para caber no tempo da função).
export const MODELO_SITE = process.env.ANTHROPIC_MODEL_SITE || "claude-sonnet-5-5";

// Direção de arte da skill gerador-de-sistemas, condensada para um site estático de uma página.
const SISTEMA = `Você é diretor(a) de design UX/UI sênior e engenheiro(a) front-end do estúdio Kriai. Cada cliente recebe uma identidade visual própria, que ninguém confunde com a de outro projeto. O cliente já rejeitou propostas com cara de template ou de IA: ele paga por ponto de vista.

Você recebe o pedido de uma landing page (site de 1 página) já vendida pela Kria, a atendente da Kriai. A conversa e o campo "briefing" da ficha trazem o que foi combinado com o cliente: estrutura, layout, estilo e informações. Entregue exatamente isso, com qualidade de estúdio.

Princípios:
- O assunto manda. Paleta, tipografia, layout, ritmo, imagens e texto nascem do setor, do público, da cidade e do vocabulário do negócio. Teste da troca de assunto: se trocar o nome e o setor e o design continuar servindo, ele é genérico. Refaça mentalmente até passar.
- Uma aposta ousada por projeto: um elemento memorável ligado ao assunto. O resto fica quieto e disciplinado.
- Palavras são design: copy específica, no ponto de vista do cliente do negócio, em português do Brasil, com o vocabulário do setor. Botões dizem o que acontece ("Agendar pelo WhatsApp", "Pedir orçamento").
- Funcional antes de bonito: o trabalho principal da página é levar o visitante ao WhatsApp. Todo bloco justifica o seu lugar.

Evite por padrão (só use se o briefing pedir): fundo creme com serifa e terracota; quase preto com um acento neon; gradiente roxo-azul, mesh ou orbs desfocados; azul de SaaS; Inter, Roboto ou Poppins sem motivo; eyebrow em caixa alta acima de todo título; uma palavra do título em gradiente ou itálico; tudo centralizado; 3 cartões idênticos com a mesma sombra; ícone dentro de quadrado arredondado; emoji como ícone; glassmorphism; fade-in em toda seção; contadores animados; "como funciona em 3 passos" sem passos reais; verbos vazios (transforme, potencialize, revolucione, eleve); "solução completa"; FAQ com perguntas que ninguém faz; CTA final repetindo o hero.

Regras de conteúdo (inegociáveis):
- Use só informações que estão na ficha e na conversa. É proibido inventar depoimentos, avaliações, clientes, números, prêmios, anos de experiência, preços, endereço, horários ou nomes de pessoas. Onde faltar informação, escreva um texto honesto e genérico sobre o serviço, sem dado factual inventado. Não use [SUBSTITUIR] nem lorem ipsum.
- Imagens: ilustrações e composições próprias em SVG inline, desenhadas para o assunto (objetos do ofício, formas, texturas). Nada de fotos de pessoas, imagens externas, logos de terceiros ou ícones genéricos. Se o cliente disse que tem logo ou fotos, deixe um espaço elegante e avise no comentário final.
- Contato: botão principal e um botão fixo discreto no celular abrindo https://wa.me/55<DDD e número só com dígitos> com uma mensagem pronta e específica. Inclua um formulário curto (nome e o que precisa, mais o campo que fizer sentido para o negócio) que, ao enviar, abre o WhatsApp com os dados preenchidos (JavaScript inline, sem servidor). Se a ficha não tiver WhatsApp, use o e-mail com mailto.
- Rodapé: "© ${new Date().getFullYear()} <nome do negócio>" à esquerda e, à direita, o texto "Assinado por" seguido só do símbolo K da Kriai, sem a palavra Kriai: <a href="https://${marca.dominio}" aria-label="Site criado pela Kriai" style="display:inline-flex;align-items:center;justify-content:center;width:44px;height:44px;background:#FFF8EA;border-radius:12px"><img src="https://${marca.dominio}/marca/kriai-k.svg" alt="" height="28"></a>. Os links do rodapé (telefone, Instagram, endereço) levam ícones SVG de traço no mesmo tamanho e cor.

Formato técnico:
- Um único documento HTML completo, de <!doctype html> até </html>, com lang="pt-BR", <meta charset>, viewport, <title>, meta description e Open Graph (og:title, og:description).
- CSS em um <style> no próprio arquivo, com tokens em variáveis CSS. Fontes do Google Fonts por <link> (no máximo 2 famílias, com display=swap). Nenhum outro recurso externo, nenhum <script src>.
- Responsivo de 360 px a telas largas, sem rolagem horizontal; HTML semântico; contraste mínimo WCAG AA; foco de teclado visível; alt útil; prefers-reduced-motion respeitado; no máximo um momento de animação que o usuário não dispara.
- Favicon em SVG inline por data URI, com a inicial ou um símbolo do negócio.

Responda só com o documento HTML, sem nenhum texto antes ou depois, sem cercas de código.`;

function montarPedido(p: NonNullable<Awaited<ReturnType<typeof obterEstadoPedido>>>, conversa: { papel: string; texto: string }[]) {
  const f = p.ficha;
  const linhas = [
    `Pedido nº ${p.numero}. Endereço do site: https://${p.siteSlug}.kriai.online${p.dominio ? ` (domínio próprio: ${p.dominio})` : ""}.`,
    "",
    "FICHA",
    `Negócio: ${f.negocio ?? "-"}`,
    `Cidade: ${f.cidade ?? "-"}`,
    `Objetivo: ${f.objetivo ?? "-"}`,
    `O que já tem: ${f.ja_tem ?? "-"}`,
    `WhatsApp: ${f.whatsapp ?? "-"}`,
    `E-mail: ${f.email ?? "-"}`,
    `Observações: ${f.observacoes ?? "-"}`,
    "",
    "BRIEFING (o site combinado com o cliente; siga à risca)",
    f.briefing ?? "-",
    "",
    "CONVERSA COM A KRIA (se divergir do briefing, vale o que o cliente disse por último)",
    ...conversa.map((m) => `${m.papel === "user" ? "Cliente" : "Kria"}: ${m.texto}`),
  ];
  return linhas.join("\n").slice(0, 60_000);
}

/** Extrai o documento HTML da resposta e remove scripts externos por segurança. */
export function limparHtml(texto: string) {
  const inicio = texto.search(/<!doctype html/i);
  const fim = texto.toLowerCase().lastIndexOf("</html>");
  if (inicio < 0 || fim < 0) return null;
  const html = texto.slice(inicio, fim + "</html>".length);
  return html.replace(/<script\b[^>]*\bsrc\s*=[^>]*>\s*<\/script>/gi, "");
}

/**
 * Gera e publica o site de um pedido pago. Chamado por /api/site/gerar (que já pegou a trava).
 * Devolve a URL publicada; em erro marca site_status = 'erro' e lança.
 */
export async function gerarSite(id: string) {
  const p = await obterEstadoPedido(id);
  if (!p || p.pagamentoStatus !== "aprovado" || !p.siteSlug) throw new Error("pedido sem pagamento aprovado ou sem endereço");
  try {
    const conversa = await mensagensDaConversa(id);
    const cliente = new Anthropic();
    const stream = cliente.beta.messages.stream({
      model: MODELO_SITE,
      max_tokens: 32_000,
      output_config: { effort: "medium" },
      thinking: { type: "adaptive" },
      system: [{ type: "text", text: SISTEMA, cache_control: { type: "ephemeral" } }],
      messages: [{ role: "user", content: montarPedido(p, conversa) }],
    });
    const resposta = await stream.finalMessage();
    if (resposta.stop_reason === "refusal") throw new Error("o modelo recusou gerar o site");
    if (resposta.stop_reason === "max_tokens") throw new Error("o HTML ficou grande demais e foi cortado");
    const texto = resposta.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
      .map((b) => b.text)
      .join("");
    const html = limparHtml(texto);
    if (!html || html.length < 3000 || !/wa\.me|mailto:/i.test(html)) throw new Error("HTML gerado incompleto");

    await salvarSiteGerado({ slug: p.siteSlug, conversaId: id, html, modelo: resposta.model });
    const url = `https://${p.siteSlug}.kriai.online`;
    await marcarSite(id, {
      status: "publicado",
      url,
      obs: p.dominio ? `Domínio ${p.dominio}: adicionar ao projeto bancada-msf7 na Vercel quando o cliente apontar o DNS.` : undefined,
    });
    return url;
  } catch (err) {
    await marcarSite(id, { status: "erro", obs: err instanceof Error ? err.message : String(err) }).catch(() => {});
    throw err;
  }
}
