"use client";

import { useEffect, useState, useSyncExternalStore } from "react";
import { demonstracoes } from "@/content/site";

const QUADRO = 38; // ms por letra digitada
const pausa = (ms: number) => Math.ceil(ms / QUADRO);

function useMovimentoReduzido() {
  return useSyncExternalStore(
    (aviso) => {
      const m = matchMedia("(prefers-reduced-motion: reduce)");
      m.addEventListener("change", aviso);
      return () => m.removeEventListener("change", aviso);
    },
    () => matchMedia("(prefers-reduced-motion: reduce)").matches,
    () => false,
  );
}

/** Digita um pedido de exemplo e mostra, linha por linha, o que o sistema tirou dele. */
export function Demonstracao() {
  const reduz = useMovimentoReduzido();
  const [estado, setEstado] = useState({ i: 0, passo: 0 });
  const d = demonstracoes[estado.i % demonstracoes.length];

  useEffect(() => {
    if (reduz) return;
    const x = setInterval(
      () =>
        setEstado((s) => {
          const total = demonstracoes[s.i % demonstracoes.length].cliente.length + pausa(4800);
          return s.passo >= total ? { i: s.i + 1, passo: 0 } : { ...s, passo: s.passo + 1 };
        }),
      QUADRO,
    );
    return () => clearInterval(x);
  }, [reduz]);

  const tam = d.cliente.length;
  const passo = reduz ? Infinity : estado.passo;
  const letras = Math.min(tam, passo);
  const linhas = [0, 1, 2].filter((n) => passo >= tam + pausa(350 + n * 450)).length;
  const saidas = [
    ["Entendi", d.entendi],
    ["Plano", d.plano],
    ["Custa", d.custa],
  ];

  return (
    <div className="demo" aria-label="Exemplo de como o atendimento entende um pedido">
      <p className="demo-in">
        <span className="rotulo">Cliente</span>
        <q className={letras >= tam ? "pronto" : undefined}>{d.cliente.slice(0, letras)}</q>
      </p>
      <dl className="demo-out">
        {saidas.map(([r, v], n) => (
          <div key={r} className={linhas > n ? "on" : undefined}>
            <dt className="rotulo">{r}</dt>
            <dd>{v}</dd>
          </div>
        ))}
      </dl>
    </div>
  );
}
