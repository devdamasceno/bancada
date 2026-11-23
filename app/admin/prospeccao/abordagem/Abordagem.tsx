"use client";

import { useState, useTransition } from "react";
import type { ItemFila } from "@/lib/prospeccao";
import { enviadoNaAbordagem, pularNaAbordagem, statusNaAbordagem } from "../acoes";

type Item = ItemFila & { mensagem: string };

const META = 15; // leads por dia

function linkWhats(tel: string | null, texto: string) {
  const d = (tel ?? "").replace(/\D/g, "").replace(/^55/, "");
  return `https://wa.me/55${d}?text=${encodeURIComponent(texto)}`;
}

export function Abordagem({ itens, enviadosHoje, filtro }: { itens: Item[]; enviadosHoje: number; filtro: string }) {
  const [i, setI] = useState(0);
  const [feitos, setFeitos] = useState(enviadosHoje);
  const [textos, setTextos] = useState<Record<string, string>>({});
  const [erro, setErro] = useState<string | null>(null);
  const [pendente, iniciar] = useTransition();
  const p = itens[i];

  const proximo = () => setI((n) => n + 1);
  const rodar = (f: () => Promise<void>, depois?: () => void) =>
    iniciar(async () => {
      try {
        setErro(null);
        await f();
        depois?.();
        proximo();
      } catch {
        setErro("Não consegui salvar. Tente de novo.");
      }
    });

  if (!p) {
    return (
      <div className="adm-cartao abord-fim">
        <strong>Fila zerada{filtro ? ` para ${filtro}` : ""}. 🎉</strong>
        <p className="prosp-dica">
          {feitos} contato{feitos === 1 ? "" : "s"} hoje. Os acompanhamentos voltam para cá 2 dias depois da primeira mensagem.
          Para ter mais leads, faça uma nova busca na prospecção.
        </p>
        <a className="adm-botao-fita adm-pequeno" href="/admin/prospeccao">
          Buscar mais leads
        </a>
      </div>
    );
  }

  const texto = textos[p.place_id] ?? p.mensagem;
  const enviar = () => {
    window.open(linkWhats(p.telefone, texto), "_blank", "noopener");
    rodar(() => enviadoNaAbordagem(p.place_id), () => setFeitos((n) => n + 1));
  };

  return (
    <div className="abord">
      <div className="abord-placar">
        <span>
          Hoje: <b>{feitos}</b> / {META}
        </span>
        <span className="abord-barra" aria-hidden="true">
          <i style={{ width: `${Math.min(100, (feitos / META) * 100)}%` }} />
        </span>
        <span className="prosp-dica">
          {i + 1} de {itens.length} na fila{filtro ? ` · ${filtro}` : ""}
        </span>
      </div>

      <article className="adm-cartao abord-cartao">
        <div className="abord-topo">
          <span className={`abord-etapa ${p.etapa}`}>{p.etapa === "primeira" ? "Primeira mensagem" : "Acompanhamento"}</span>
          <span className="adm-nota t-quente">
            {p.pontuacao}
            <small>pontos</small>
          </span>
        </div>
        <h2>{p.nome}</h2>
        <p className="prosp-dica">
          {p.segmento} · {p.local}
          {p.nota_google ? ` · ★ ${p.nota_google} (${p.avaliacoes ?? 0})` : ""}
        </p>
        <span className="prosp-motivos">
          {p.motivos.map((m) => (
            <em key={m}>{m}</em>
          ))}
        </span>
        <span className="prosp-links">
          {p.instagram && (
            <a href={p.instagram} target="_blank" rel="noopener noreferrer">
              Abrir Instagram (siga e curta antes)
            </a>
          )}
          {p.maps_url && (
            <a href={p.maps_url} target="_blank" rel="noopener noreferrer">
              Ver no Google Maps
            </a>
          )}
        </span>

        <label className="abord-msg">
          Mensagem (pode ajustar antes de enviar)
          <textarea value={texto} onChange={(e) => setTextos((t) => ({ ...t, [p.place_id]: e.target.value }))} rows={7} />
        </label>

        <div className="abord-acoes">
          {p.celular ? (
            <button type="button" className="adm-botao-zap abord-enviar" onClick={enviar} disabled={pendente}>
              Enviar no WhatsApp
            </button>
          ) : (
            <a className="adm-botao-fita abord-enviar" href={`tel:${(p.telefone ?? "").replace(/\D/g, "")}`}>
              Fixo: ligar {p.telefone}
            </a>
          )}
          {!p.celular && (
            <button type="button" className="adm-pequeno" disabled={pendente} onClick={() => rodar(() => enviadoNaAbordagem(p.place_id), () => setFeitos((n) => n + 1))}>
              Já liguei
            </button>
          )}
          <button type="button" className="adm-pequeno" disabled={pendente} onClick={() => rodar(() => statusNaAbordagem(p.place_id, "interessado"))}>
            Respondeu: interessado
          </button>
          <button type="button" className="adm-pequeno" disabled={pendente} onClick={() => rodar(() => pularNaAbordagem(p.place_id))}>
            Pular
          </button>
          <button type="button" className="adm-pequeno" disabled={pendente} onClick={() => rodar(() => statusNaAbordagem(p.place_id, "descartado"))}>
            Descartar
          </button>
        </div>
        {erro && <p className="adm-erro">{erro}</p>}
      </article>
    </div>
  );
}
