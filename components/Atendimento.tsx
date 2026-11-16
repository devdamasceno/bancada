"use client";

import { useEffect, useRef, useState } from "react";
import { atendimento as t, ficha as tf } from "@/content/site";
import type { EventoAtendimento } from "@/app/api/atendimento/route";
import { fichaVazia, type Ficha as TFicha } from "@/lib/ficha";
import { entenderRascunho } from "@/lib/detect";
import { idVisitante, lerPreferencias } from "@/lib/consent";
import { registrar } from "@/lib/track";
import { Demonstracao } from "@/components/Demonstracao";
import { Ficha } from "@/components/Ficha";
import { BotaoWhatsapp, Logo } from "@/components/Marca";
import { pulsar } from "@/components/Fundo";
import { CHAVE_CONVERSA } from "@/lib/chaves";

type Mensagem = { papel: "cliente" | "ia"; texto: string };

const hora = (d: Date = new Date()) => d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });

// Com permissão de personalização a conversa é lembrada entre visitas; sem ela, só enquanto a aba estiver aberta.
function armazenamento() {
  try {
    return lerPreferencias()?.personalizacao ? localStorage : sessionStorage;
  } catch {
    return null;
  }
}
function lerIdSalvo() {
  try {
    return localStorage.getItem(CHAVE_CONVERSA) ?? sessionStorage.getItem(CHAVE_CONVERSA);
  } catch {
    return null;
  }
}

export function Atendimento() {
  const [conversaId, setConversaId] = useState<string | null>(null);
  const [mensagens, setMensagens] = useState<Mensagem[]>([]);
  const [rascunho, setRascunho] = useState("");
  const [respondendo, setRespondendo] = useState(false);
  const [erro, setErro] = useState<string | null>(null);
  const [ficha, setFicha] = useState<TFicha>(fichaVazia);
  const [valor, setValor] = useState(0);
  const [salvoEm, setSalvoEm] = useState<string | null>(null);
  const [numeroPedido, setNumeroPedido] = useState<string | null>(null);
  const [enviandoPedido, setEnviandoPedido] = useState(false);
  const [erroPedido, setErroPedido] = useState<string | null>(null);
  const [novidades, setNovidades] = useState(false);
  const lista = useRef<HTMLDivElement>(null);
  const campo = useRef<HTMLTextAreaElement>(null);
  const formulario = useRef<HTMLFormElement>(null);

  const conversando = mensagens.length > 0;
  const tags = entenderRascunho(rascunho);

  // reabre a conversa salva (recarregou a página ou voltou outro dia)
  useEffect(() => {
    const id = lerIdSalvo();
    if (!id) return;
    fetch(`/api/atendimento?id=${id}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (!d?.mensagens?.length) return;
        setConversaId(id);
        setMensagens(d.mensagens);
        setFicha({ ...fichaVazia(), ...d.ficha });
        setValor(d.valor ?? 0);
        setNumeroPedido(d.numero ?? null);
        setSalvoEm(hora(d.atualizadaEm ? new Date(d.atualizadaEm) : undefined));
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    lista.current?.scrollTo({ top: lista.current.scrollHeight });
  }, [mensagens]);

  const alterarUltimaIa = (f: (texto: string) => string) =>
    setMensagens((ms) => {
      const i = ms.length - 1;
      if (i < 0 || ms[i].papel !== "ia") return ms;
      return [...ms.slice(0, i), { papel: "ia", texto: f(ms[i].texto) }];
    });

  async function enviarMensagem(texto: string) {
    if (respondendo) return;
    const mensagem = texto.trim();
    if (!mensagem) {
      setErro(t.erros.vazio);
      campo.current?.focus();
      return;
    }
    setErro(null);

    let id = conversaId;
    if (!id) {
      id = crypto.randomUUID();
      setConversaId(id);
      try {
        armazenamento()?.setItem(CHAVE_CONVERSA, id);
      } catch {}
      registrar("atendimento_iniciado");
    }

    setMensagens((ms) => [...ms, { papel: "cliente", texto: mensagem }, { papel: "ia", texto: "" }]);
    setRascunho("");
    setRespondendo(true);
    pulsar(formulario.current);

    const falhar = (msg: string, devolverTexto: boolean) => {
      setErro(msg);
      setMensagens((ms) => {
        let r = ms[ms.length - 1]?.papel === "ia" && !ms[ms.length - 1].texto ? ms.slice(0, -1) : ms;
        if (devolverTexto && r[r.length - 1]?.texto === mensagem) r = r.slice(0, -1);
        return r;
      });
      if (devolverTexto) setRascunho(mensagem);
    };

    try {
      const resposta = await fetch("/api/atendimento", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          conversaId: id,
          mensagem,
          meta: {
            origem: document.referrer || null,
            utm: Object.fromEntries([...new URLSearchParams(location.search)].filter(([k]) => k.startsWith("utm_"))),
            dispositivo: matchMedia("(pointer: coarse)").matches ? "celular" : "computador",
            visitante: idVisitante(),
          },
        }),
      });
      if (!resposta.ok || !resposta.body) throw new Error(String(resposta.status));

      const leitor = resposta.body.getReader();
      const dec = new TextDecoder();
      let buffer = "";
      for (;;) {
        const { value, done } = await leitor.read();
        if (done) break;
        buffer += dec.decode(value, { stream: true });
        const linhas = buffer.split("\n");
        buffer = linhas.pop() ?? "";
        for (const linha of linhas) {
          if (!linha.trim()) continue;
          const e = JSON.parse(linha) as EventoAtendimento;
          if (e.tipo === "texto") {
            alterarUltimaIa((x) => (x + e.delta).replace(/^\s+/, ""));
            pulsar(formulario.current);
          } else if (e.tipo === "ficha") {
            setFicha(e.ficha);
            setValor(e.valor);
            setSalvoEm(hora());
          } else if (e.tipo === "salvo") {
            setSalvoEm(hora());
          } else if (e.tipo === "recusa") {
            alterarUltimaIa(() => t.erros.recusa);
          } else if (e.tipo === "erro") {
            falhar(t.erros[e.codigo], e.codigo !== "limite");
          }
        }
      }
    } catch {
      falhar(t.erros.servidor, true);
    } finally {
      setRespondendo(false);
      setMensagens((ms) => (ms[ms.length - 1]?.papel === "ia" && !ms[ms.length - 1].texto ? ms.slice(0, -1) : ms));
    }
  }

  async function enviarPedido() {
    if (!conversaId) return;
    setEnviandoPedido(true);
    setErroPedido(null);
    try {
      const r = await fetch("/api/pedido", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ conversaId, novidades }),
      });
      const d = await r.json();
      if (!r.ok || !d.numero) throw new Error(d.erro);
      setNumeroPedido(d.numero);
      registrar("pedido_enviado", { servicos: ficha.servicos });
    } catch {
      setErroPedido(tf.erroEnvio);
    } finally {
      setEnviandoPedido(false);
    }
  }

  return (
    <div className={conversando ? "app conversando" : "app"}>
      <header className="topo">
        <Logo />
        <BotaoWhatsapp texto={t.linkWhatsapp} mensagem={t.whatsappMensagem} />
      </header>

      <main className="palco" id="conteudo">
        <section className="conversa" aria-label="Atendimento">
          {!conversando && (
            <div className="abertura">
              <h1>
                {t.titulo} <em>{t.tituloDestaque}</em>
              </h1>
              <p>{t.texto}</p>
              <Demonstracao />
            </div>
          )}

          {conversando && (
            <div className="mensagens" ref={lista} aria-live="polite" aria-busy={respondendo}>
              {mensagens.map((m, i) => (
                <div
                  key={i}
                  className={`msg ${m.papel === "cliente" ? "cli" : "ia"}${
                    m.papel === "ia" && respondendo && i === mensagens.length - 1 ? " digitando" : ""
                  }`}
                >
                  <p>{m.texto || (m.papel === "ia" ? t.pensando : "")}</p>
                </div>
              ))}
            </div>
          )}

          <form
            ref={formulario}
            className="composer"
            onSubmit={(e) => {
              e.preventDefault();
              enviarMensagem(rascunho);
            }}
          >
            <label htmlFor="mensagem" className="sr-only">
              {t.rotuloCampo}
            </label>
            <textarea
              ref={campo}
              id="mensagem"
              rows={2}
              maxLength={2000}
              value={rascunho}
              placeholder={conversando ? t.placeholderConversa : t.placeholder}
              aria-invalid={!!erro}
              aria-describedby={erro ? "erro-mensagem" : undefined}
              onChange={(e) => {
                setRascunho(e.target.value);
                pulsar(formulario.current);
              }}
              onKeyDown={(e) => {
                if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) {
                  e.preventDefault();
                  formulario.current?.requestSubmit();
                }
              }}
            />
            <span className="dica rotulo" aria-hidden="true">
              {t.dica}
            </span>
            <button className="enviar" type="submit" disabled={respondendo}>
              {t.enviar} →
            </button>
          </form>

          {erro && (
            <p id="erro-mensagem" className="erro" role="alert">
              {erro}
            </p>
          )}

          {!conversando && (
            <p className="entendi" aria-live="polite">
              {tags.length > 0 && (
                <>
                  <span className="rotulo">{t.jaEntendi}</span>
                  {tags.map((x) => (
                    <span key={x} className="tag">
                      {x}
                    </span>
                  ))}
                </>
              )}
            </p>
          )}
        </section>

        {conversando && (
          <Ficha
            ficha={ficha}
            valor={valor}
            salvoEm={salvoEm}
            salvando={respondendo && !salvoEm}
            numeroPedido={numeroPedido}
            enviando={enviandoPedido}
            erroEnvio={erroPedido}
            novidades={novidades}
            onNovidades={setNovidades}
            onEnviar={enviarPedido}
          />
        )}
      </main>
    </div>
  );
}
