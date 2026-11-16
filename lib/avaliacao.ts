import "server-only";
import Anthropic from "@anthropic-ai/sdk";
import { formatarReais, marca, ficha as rotulos, servicos } from "@/content/site";
import { MODELO } from "@/lib/atendente";
import type { Avaliacao, LeadCompleto } from "@/lib/db";

// Avaliação do lead para a área administrativa. Roda quando o pedido é enviado e quando você pede no painel.
// Texto fixo (sem dados do lead) para o cache do prompt funcionar entre avaliações.
const CRITERIOS = `Você avalia leads do site da ${marca.nome}, um estúdio que vende para pequenos negócios: site, vídeo, logo e artes, edição de vídeo e de imagem, e presença no Google. Quem vai ler a sua avaliação é o dono do estúdio, que decide a quem responder primeiro e como abordar.

Serviços e preços de entrada:
${servicos.map((s) => `- ${s.nome}: a partir de ${formatarReais(s.aPartirDe)}${s.unidade ? ` ${s.unidade}` : ""}`).join("\n")}

Como dar a nota (0 a 100), pesando:
- Contato: tem nome e WhatsApp ou e-mail? Sem contato, o lead quase não vale (no máximo 25).
- Encaixe: o que a pessoa quer está entre os serviços acima?
- Dinheiro: o investimento que ela citou cobre o valor de entrada do plano? Se não citou, é neutro.
- Urgência: tem prazo próximo ou um motivo concreto (inauguração, data, perda de clientes)?
- Clareza e engajamento: sabe o que quer, respondeu às perguntas, conversou até o fim.
- Sinais de alerta: pede o que o estúdio não faz, quer tudo de graça, parece teste ou brincadeira, dados de contato estranhos.

Temperatura: "quente" para nota 70 ou mais, "morno" de 40 a 69, "frio" abaixo de 40.

Escreva em português do Brasil, direto, sem floreio:
- resumo: 1 ou 2 frases dizendo quem é e o que quer.
- pontos_fortes e alertas: até 3 itens curtos cada (lista vazia se não houver).
- proximo_passo: a ação concreta para o dono fazer agora (ex.: "Mandar proposta do site + Google hoje pelo WhatsApp").
- mensagem_sugerida: a primeira mensagem de WhatsApp para o dono mandar ao cliente, em 2 a 4 frases, chamando pelo nome, citando o negócio e o plano, e terminando com uma pergunta simples. Sem markdown.

Use só o que está na ficha e na conversa. Não invente fatos.`;

const ESQUEMA = {
  type: "object",
  properties: {
    nota: { type: "integer", description: "0 a 100" },
    temperatura: { type: "string", enum: ["quente", "morno", "frio"] },
    resumo: { type: "string" },
    pontos_fortes: { type: "array", items: { type: "string" } },
    alertas: { type: "array", items: { type: "string" } },
    proximo_passo: { type: "string" },
    mensagem_sugerida: { type: "string" },
  },
  required: ["nota", "temperatura", "resumo", "pontos_fortes", "alertas", "proximo_passo", "mensagem_sugerida"],
  additionalProperties: false,
} as const;

function descreverLead(lead: LeadCompleto) {
  const f = lead.ficha;
  const nomes = servicos.filter((s) => f.servicos.includes(s.id)).map((s) => s.nome);
  const campos = (Object.keys(rotulos.campos) as (keyof typeof rotulos.campos)[])
    .filter((c) => c !== "servicos")
    .map((c) => `${rotulos.campos[c]}: ${(f as Record<string, unknown>)[c] || "(não informado)"}`);
  const conversa = lead.mensagens.map((m) => `${m.papel === "cliente" ? "Cliente" : "Atendente"}: ${m.texto}`).join("\n");
  return `Situação: ${lead.situacao === "enviado" ? "pedido enviado" : lead.situacao === "abandonado" ? "parou de responder sem enviar" : "ainda conversando"}

Ficha:
Serviços: ${nomes.join(", ") || "(nenhum)"}
Valor de entrada do plano: ${formatarReais(lead.valorMinimo)}
${campos.join("\n")}

Conversa:
${conversa || "(sem mensagens)"}`;
}

export async function avaliarLead(lead: LeadCompleto): Promise<Avaliacao> {
  const cliente = new Anthropic();
  const resposta = await cliente.messages.create({
    model: MODELO,
    max_tokens: 4096,
    output_config: { effort: "medium", format: { type: "json_schema", schema: ESQUEMA } },
    system: [{ type: "text", text: CRITERIOS, cache_control: { type: "ephemeral" } }],
    messages: [{ role: "user", content: descreverLead(lead) }],
  });

  if (resposta.stop_reason === "refusal") throw new Error("a IA recusou avaliar este lead");
  if (resposta.stop_reason === "max_tokens") throw new Error("a avaliação foi cortada (max_tokens)");
  const texto = resposta.content.flatMap((b) => (b.type === "text" ? [b.text] : [])).join("");
  const a = JSON.parse(texto) as Avaliacao;
  a.nota = Math.max(0, Math.min(100, Math.round(a.nota)));
  return a;
}
