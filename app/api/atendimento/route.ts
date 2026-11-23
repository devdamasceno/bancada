import Anthropic from "@anthropic-ai/sdk";
import { after } from "next/server";
import { COM_FALLBACK, FERRAMENTA_DOMINIO, FERRAMENTA_FICHA, FERRAMENTA_PAGAMENTO, INSTRUCOES, MODELO } from "@/lib/atendente";
import { anexarMensagens, criarConversa, obterConversa, salvarFicha, type MensagemSalva, type Meta } from "@/lib/db";
import { normalizarDominio, verificarDominio } from "@/lib/dominio";
import { fecharPedido } from "@/lib/fechamento";
import { faltaParaFechar, mesclar, validarAtualizacao, valorMinimo, type Ficha } from "@/lib/ficha";
import { notificarNovoContato, processarPedidoEnviado, temContato } from "@/lib/notificacao";

// Vercel: dá tempo para a IA terminar a resposta.
export const maxDuration = 60;

const MAX_MENSAGENS_CLIENTE = 30; // por conversa
const MAX_CARACTERES = 2000;
const MAX_VOLTAS = 6; // chamadas à IA por mensagem (texto + ferramentas)
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

// Limite simples por IP (memória do servidor; reinicia a cada deploy). Evita que um robô gaste sua conta.
const acessos = new Map<string, number[]>();
function devagar(ip: string) {
  const agora = Date.now();
  const recentes = (acessos.get(ip) ?? []).filter((t) => agora - t < 60_000);
  recentes.push(agora);
  acessos.set(ip, recentes);
  if (acessos.size > 5000) acessos.clear();
  return recentes.length > 15;
}

const texto = (v: unknown, max: number) => (typeof v === "string" ? v.trim().slice(0, max) : "");

/** Eventos enviados ao navegador, um JSON por linha. */
export type EventoAtendimento =
  | { tipo: "texto"; delta: string }
  | { tipo: "ficha"; ficha: Ficha; valor: number }
  | { tipo: "pagamento"; numero: string; link: string; acompanhar: string }
  | { tipo: "salvo" }
  | { tipo: "recusa" }
  | { tipo: "erro"; codigo: "servidor" | "limite" | "devagar" }
  | { tipo: "fim" };

/** Reabre uma conversa (ao recarregar a página ou voltar outro dia). */
export async function GET(request: Request) {
  const id = new URL(request.url).searchParams.get("id") ?? "";
  if (!UUID.test(id)) return Response.json({ erro: "id" }, { status: 400 });
  const salvo = await obterConversa(id);
  if (!salvo) return Response.json({ erro: "nao_encontrada" }, { status: 404 });
  return Response.json({
    status: salvo.conversa.status,
    numero: salvo.conversa.numero,
    atualizadaEm: salvo.conversa.atualizadaEm,
    ficha: salvo.conversa.ficha,
    valor: valorMinimo(salvo.conversa.ficha),
    // respostas da IA separadas por uma atualização de ficha voltam como um balão só, como apareceram ao vivo
    mensagens: salvo.mensagens
      .filter((m) => m.texto)
      .reduce<{ papel: "cliente" | "ia"; texto: string }[]>((lista, m) => {
        const papel = m.papel === "user" ? "cliente" : "ia";
        const ultima = lista.at(-1);
        if (papel === "ia" && ultima?.papel === "ia") ultima.texto += ` ${m.texto}`;
        else lista.push({ papel, texto: m.texto as string });
        return lista;
      }, []),
  });
}

export async function POST(request: Request) {
  let corpo: Record<string, unknown>;
  try {
    corpo = await request.json();
  } catch {
    return Response.json({ erro: "corpo" }, { status: 400 });
  }
  const id = texto(corpo.conversaId, 36);
  const mensagem = texto(corpo.mensagem, MAX_CARACTERES);
  if (!UUID.test(id) || !mensagem) return Response.json({ erro: "dados" }, { status: 400 });

  const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  const base = process.env.SITE_URL?.replace(/\/$/, "") || new URL(request.url).origin;

  // O aviso de novo contato roda depois da resposta; o after() segura a função até ele terminar.
  let fimDaConversa: () => void = () => {};
  const conversaTerminou = new Promise<void>((ok) => (fimDaConversa = ok));
  let avisoContato: Promise<unknown> | null = null;
  let avisoPedido: Promise<unknown> | null = null;
  after(async () => {
    await conversaTerminou;
    await avisoContato;
    await avisoPedido;
  });

  const corrente = new ReadableStream<Uint8Array>({
    async start(controller) {
      const cod = new TextEncoder();
      let aberto = true;
      // Se o cliente fechar a aba, a IA termina a resposta mesmo assim e tudo fica salvo.
      const enviar = (e: EventoAtendimento) => {
        if (!aberto) return;
        try {
          controller.enqueue(cod.encode(JSON.stringify(e) + "\n"));
        } catch {
          aberto = false;
        }
      };

      try {
        if (devagar(ip)) {
          enviar({ tipo: "erro", codigo: "devagar" });
          return;
        }

        const meta = (corpo.meta ?? {}) as Record<string, unknown>;
        const salvo =
          (await obterConversa(id)) ??
          ({
            conversa: await criarConversa(id, {
              origem: texto(meta.origem, 500) || null,
              utm:
                meta.utm && typeof meta.utm === "object"
                  ? Object.fromEntries(
                      Object.entries(meta.utm as Record<string, unknown>)
                        .filter(([k, v]) => k.startsWith("utm_") && typeof v === "string")
                        .slice(0, 10)
                        .map(([k, v]) => [k.slice(0, 40), (v as string).slice(0, 200)]),
                    )
                  : {},
              dispositivo: texto(meta.dispositivo, 20) || null,
              visitante: texto(meta.visitante, 64) || null,
            } satisfies Meta),
            mensagens: [] as MensagemSalva[],
          } as const);

        const doCliente = salvo.mensagens.filter((m) => m.papel === "user" && m.texto).length;
        if (doCliente >= MAX_MENSAGENS_CLIENTE) {
          enviar({ tipo: "erro", codigo: "limite" });
          return;
        }

        // 1. Salva a mensagem do cliente antes de qualquer coisa.
        await anexarMensagens(id, [{ papel: "user", conteudo: mensagem, texto: mensagem }]);
        enviar({ tipo: "salvo" });

        const historico: Anthropic.Beta.BetaMessageParam[] = montarHistorico(salvo.mensagens);
        historico.push({ role: "user", content: mensagem });

        let ficha = salvo.conversa.ficha;
        if (!process.env.ANTHROPIC_API_KEY) {
          console.error("[atendimento] ANTHROPIC_API_KEY não configurada: coloque a chave no .env.local e reinicie o servidor.");
          enviar({ tipo: "erro", codigo: "servidor" });
          return;
        }
        const cliente = new Anthropic();
        let falhasJson = 0;

        for (let volta = 0; volta < MAX_VOLTAS; volta++) {
          const stream = cliente.beta.messages.stream({
            model: MODELO,
            max_tokens: 4096,
            // conversa de vendas: pouca reflexão, resposta rápida
            output_config: { effort: "low" },
            // drop_block: o raciocínio salvo fica preso ao prompt em que nasceu. Quando você edita as instruções
            // (ou troca de modelo), as conversas já abertas descartam esse raciocínio antigo em vez de dar erro 400.
            thinking: { type: "adaptive", block_binding: { prefix_mismatch_behavior: "drop_block" } },
            betas: [
              "thinking-binding-controls-2026-08-01",
              // se o modelo recusar por engano, a API tenta de novo em outro modelo (não existe no Haiku)
              ...(COM_FALLBACK ? ["server-side-fallback-2026-07-01"] : []),
            ],
            ...(COM_FALLBACK ? { fallbacks: "default" as const } : {}),
            system: [{ type: "text", text: INSTRUCOES, cache_control: { type: "ephemeral" } }],
            cache_control: { type: "ephemeral" },
            tools: [FERRAMENTA_FICHA, FERRAMENTA_DOMINIO, FERRAMENTA_PAGAMENTO],
            messages: historico,
          });
          stream.on("text", (delta) => enviar({ tipo: "texto", delta }));

          let resposta: Anthropic.Beta.BetaMessage;
          try {
            resposta = await stream.finalMessage();
            falhasJson = 0;
            if (process.env.NODE_ENV !== "production") {
              const u = resposta.usage;
              console.info(
                `[atendimento] ${resposta.model} · entrada ${u.input_tokens} · cache lido ${u.cache_read_input_tokens ?? 0} · cache gravado ${u.cache_creation_input_tokens ?? 0} · saída ${u.output_tokens}`,
              );
            }
          } catch (err) {
            // só repete quando a entrada da ferramenta veio com JSON quebrado; erros da API sobem
            if (err instanceof Anthropic.APIError || falhasJson++ >= 2) throw err;
            continue;
          }

          if (resposta.stop_reason === "refusal") {
            enviar({ tipo: "recusa" });
            break;
          }

          const chamadas = resposta.content.filter((b): b is Anthropic.Beta.BetaToolUseBlock => b.type === "tool_use");
          if (resposta.stop_reason === "max_tokens" && chamadas.length) throw new Error("entrada da ficha cortada");

          const textoIa = resposta.content
            .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === "text")
            .map((b) => b.text)
            .join("")
            .trim();
          const daIa: MensagemSalva = { papel: "assistant", conteudo: resposta.content, texto: textoIa || null };
          historico.push({ role: "assistant", content: resposta.content });

          if (!chamadas.length) {
            await anexarMensagens(id, [daIa]);
            break;
          }

          const resultados: Anthropic.Beta.BetaToolResultBlockParam[] = [];
          const fichaAntes = ficha;
          // primeiro as atualizações da ficha, depois domínio e pagamento (que leem a ficha já atualizada)
          const ordem = [...chamadas].sort((a, b) => Number(b.name === "atualizar_ficha") - Number(a.name === "atualizar_ficha"));
          for (const chamada of ordem) {
            if (chamada.name === "atualizar_ficha") {
              const novo = validarAtualizacao(chamada.input);
              if (!novo) {
                resultados.push({
                  type: "tool_result",
                  tool_use_id: chamada.id,
                  is_error: true,
                  content: JSON.stringify({ INVALID_JSON: JSON.stringify(chamada.input) }),
                });
                continue;
              }
              ficha = mesclar(ficha, novo);
              resultados.push({ type: "tool_result", tool_use_id: chamada.id, content: "Ficha atualizada." });
            } else if (chamada.name === "verificar_dominio") {
              resultados.push({ type: "tool_result", tool_use_id: chamada.id, content: await conferirDominios(chamada.input) });
            } else if (chamada.name === "gerar_link_pagamento") {
              const falta = faltaParaFechar(ficha);
              if (falta.length) {
                resultados.push({
                  type: "tool_result",
                  tool_use_id: chamada.id,
                  is_error: true,
                  content: `Ainda não dá para gerar o link. Falta: ${falta.join("; ")}.`,
                });
                continue;
              }
              try {
                await salvarFicha(id, ficha);
                const jaEnviado = salvo.conversa.status === "enviado";
                const f = await fecharPedido(id, base);
                if (!f?.link || !f.acompanhar) throw new Error("link não gerado");
                enviar({ tipo: "pagamento", numero: f.numero, link: f.link, acompanhar: f.acompanhar });
                if (!jaEnviado && !avisoPedido) avisoPedido = processarPedidoEnviado(id, base);
                resultados.push({
                  type: "tool_result",
                  tool_use_id: chamada.id,
                  content: `Pedido nº ${f.numero} confirmado. O botão "Pagar ${f.valor ? `R$ ${f.valor}` : ""} com Mercado Pago" já apareceu na ficha (Pix ou cartão em até 3x). Não escreva o link no texto.`,
                });
              } catch (err) {
                console.error("[atendimento] pagamento", id, err);
                resultados.push({
                  type: "tool_result",
                  tool_use_id: chamada.id,
                  is_error: true,
                  content:
                    "O link de pagamento não pôde ser gerado agora. Peça desculpas, diga que o pedido foi registrado e que a equipe manda o link pelo WhatsApp em instantes.",
                });
              }
            } else {
              resultados.push({ type: "tool_result", tool_use_id: chamada.id, is_error: true, content: "Ferramenta desconhecida." });
            }
          }
          const tinhaContato = temContato(salvo.conversa.ficha) || avisoContato !== null;
          if (ficha !== fichaAntes) {
            await salvarFicha(id, ficha);
            enviar({ tipo: "ficha", ficha, valor: valorMinimo(ficha) });
          }
          // primeiro WhatsApp ou e-mail na conversa: avisa você por e-mail (uma vez só, controlado no banco)
          if (!tinhaContato && temContato(ficha)) avisoContato = notificarNovoContato(id, base);

          historico.push({ role: "user", content: resultados });
          await anexarMensagens(id, [daIa, { papel: "user", conteudo: resultados, texto: null }]);
          if (textoIa) enviar({ tipo: "texto", delta: " " });
        }
        enviar({ tipo: "fim" });
      } catch (err) {
        console.error("[atendimento]", err);
        enviar({ tipo: "erro", codigo: "servidor" });
      } finally {
        if (aberto) controller.close();
        fimDaConversa();
      }
    },
  });

  return new Response(corrente, {
    headers: { "Content-Type": "application/x-ndjson; charset=utf-8", "Cache-Control": "no-store" },
  });
}

/**
 * Remonta o histórico salvo para a API. Se a última resposta da IA pediu a ficha e o resultado
 * não chegou a ser salvo (queda no meio), essa resposta incompleta fica de fora.
 */
function montarHistorico(mensagens: MensagemSalva[]): Anthropic.Beta.BetaMessageParam[] {
  const h = mensagens.map((m): Anthropic.Beta.BetaMessageParam => ({ role: m.papel, content: m.conteudo }));
  const ultima = h.at(-1);
  if (
    ultima?.role === "assistant" &&
    Array.isArray(ultima.content) &&
    ultima.content.some((b) => b.type === "tool_use")
  ) {
    h.pop();
  }
  return h;
}

/** Confere os domínios pedidos pela IA (no máximo 6, em paralelo) e devolve um resumo para ela. */
async function conferirDominios(entrada: unknown) {
  const lista = Array.isArray((entrada as { dominios?: unknown })?.dominios) ? (entrada as { dominios: unknown[] }).dominios : [];
  const dominios = [...new Set(lista.map((d) => normalizarDominio(typeof d === "string" ? d : "")).filter((d): d is string => !!d))].slice(0, 6);
  if (!dominios.length) return "Nenhum domínio válido. Envie endereços completos, como nome.com.br.";
  const r = await Promise.all(dominios.map(verificarDominio));
  return r
    .map((d) => `${d.dominio}: ${d.status === "livre" ? "LIVRE" : d.status === "ocupado" ? "ocupado (já registrado)" : "não deu para conferir agora"}`)
    .join("\n");
}
