"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { consentimento as c } from "@/content/site";
import { assinarConsentimento, EVENTO_ABRIR, lerPreferencias, salvarPreferencias } from "@/lib/consent";

export function Consentimento() {
  // "pendente" no servidor: o banner só decide no navegador, onde o cookie existe
  const decidido = useSyncExternalStore(
    assinarConsentimento,
    () => (lerPreferencias() ? "sim" : "nao"),
    () => "pendente",
  );
  const [reaberto, setReaberto] = useState(false);
  const [detalhes, setDetalhes] = useState(false);
  const [analise, setAnalise] = useState(false);
  const [personalizacao, setPersonalizacao] = useState(false);
  const caixa = useRef<HTMLDivElement>(null);
  const aberto = decidido === "nao" || reaberto;

  useEffect(() => {
    const abrir = () => {
      const p = lerPreferencias();
      setAnalise(!!p?.analise);
      setPersonalizacao(!!p?.personalizacao);
      setDetalhes(true);
      setReaberto(true);
      requestAnimationFrame(() => caixa.current?.focus());
    };
    window.addEventListener(EVENTO_ABRIR, abrir);
    return () => window.removeEventListener(EVENTO_ABRIR, abrir);
  }, []);

  if (!aberto) return null;

  const decidir = (a: boolean, p: boolean) => {
    salvarPreferencias(a, p);
    setReaberto(false);
  };

  return (
    <div ref={caixa} tabIndex={-1} className="cookies" role="region" aria-labelledby="cookies-titulo">
      <p id="cookies-titulo" className="cookies-titulo">
        {c.titulo}
      </p>
      <p className="cookies-texto">
        {c.texto} <a href="/privacidade">Política de privacidade</a>
      </p>

      {detalhes && (
        <fieldset className="cookies-opcoes">
          <legend className="sr-only">Categorias de cookies</legend>
          <label className="marcacao">
            <input type="checkbox" checked disabled />
            <span>
              <strong>{c.categorias.necessarios.nome}.</strong> {c.categorias.necessarios.texto}
            </span>
          </label>
          <label className="marcacao">
            <input type="checkbox" checked={analise} onChange={(e) => setAnalise(e.target.checked)} />
            <span>
              <strong>{c.categorias.analise.nome}.</strong> {c.categorias.analise.texto}
            </span>
          </label>
          <label className="marcacao">
            <input
              type="checkbox"
              checked={personalizacao}
              onChange={(e) => setPersonalizacao(e.target.checked)}
            />
            <span>
              <strong>{c.categorias.personalizacao.nome}.</strong> {c.categorias.personalizacao.texto}
            </span>
          </label>
        </fieldset>
      )}

      {/* botões com o mesmo peso visual: recusar é tão fácil quanto aceitar (LGPD) */}
      <div className="cookies-acoes">
        <button type="button" className="botao botao-neutro" onClick={() => decidir(true, true)}>
          {c.aceitarTodos}
        </button>
        <button type="button" className="botao botao-neutro" onClick={() => decidir(false, false)}>
          {c.soNecessarios}
        </button>
        {detalhes ? (
          <button type="button" className="botao botao-neutro" onClick={() => decidir(analise, personalizacao)}>
            {c.salvar}
          </button>
        ) : (
          <button type="button" className="botao botao-neutro" onClick={() => setDetalhes(true)}>
            {c.escolher}
          </button>
        )}
      </div>
    </div>
  );
}
