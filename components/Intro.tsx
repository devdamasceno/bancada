"use client";

import { useEffect, useRef, useState } from "react";
import { intro } from "@/content/site";
import { registrar } from "@/lib/track";
import { CHAVE_INTRO } from "@/lib/chaves";
const DURACAO_LEGENDAS = intro.legendas.length * 3000;

/**
 * Abertura em tela cheia na primeira visita, com botão para pular.
 * Um script no <head> marca <html data-intro="1"> antes da pintura, então quem já viu não tem "piscada".
 * Para ver de novo: abra o site com ?intro no endereço.
 */
export function Intro() {
  const [visivel, setVisivel] = useState(true);
  const [legenda, setLegenda] = useState(0);
  const [mudo, setMudo] = useState(true);
  const video = useRef<HTMLVideoElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const fechar = (pulou: boolean) => {
    setVisivel(false);
    document.documentElement.removeAttribute("data-intro");
    try {
      localStorage.setItem(CHAVE_INTRO, "1");
    } catch {}
    registrar(pulou ? "intro_pulada" : "intro_vista");
    document.getElementById("mensagem")?.focus();
  };

  useEffect(() => {
    if (document.documentElement.dataset.intro !== "1") return;
    caixa.current?.focus();
    if (intro.video) return; // com vídeo, quem fecha é o fim do vídeo
    const troca = setInterval(() => setLegenda((n) => (n + 1) % intro.legendas.length), 3000);
    const fim = setTimeout(() => fechar(false), DURACAO_LEGENDAS);
    return () => {
      clearInterval(troca);
      clearTimeout(fim);
    };
  }, []);

  if (!visivel) return null;

  return (
    <div
      ref={caixa}
      className="intro"
      role="dialog"
      aria-modal="true"
      aria-label="Vídeo de abertura"
      tabIndex={-1}
      onKeyDown={(e) => e.key === "Escape" && fechar(true)}
    >
      {intro.video ? (
        <video
          ref={video}
          className="intro-video"
          src={intro.video}
          poster={intro.capa ?? undefined}
          autoPlay
          muted={mudo}
          playsInline
          onEnded={() => fechar(false)}
          onError={() => fechar(false)}
        />
      ) : (
        <>
          <div className="intro-fundo" aria-hidden="true" />
          <p className="intro-legenda" aria-live="polite">
            <span key={legenda}>{intro.legendas[legenda]}</span>
          </p>
          <div className="intro-barra" aria-hidden="true">
            <i style={{ animationDuration: `${DURACAO_LEGENDAS}ms` }} />
          </div>
        </>
      )}
      <div className="intro-acoes">
        {intro.video && mudo && (
          <button type="button" className="intro-botao" onClick={() => setMudo(false)}>
            {intro.ativarSom}
          </button>
        )}
        <button type="button" className="intro-botao" onClick={() => fechar(true)}>
          {intro.pular}
        </button>
      </div>
    </div>
  );
}
