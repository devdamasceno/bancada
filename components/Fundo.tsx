"use client";

import { useEffect, useRef } from "react";

export const EVENTO_PULSO = "kriai:pulso";

/** Dispara uma onda no fundo a partir de um ponto da tela (ex.: o campo de mensagem). */
export function pulsar(el: Element | null) {
  if (!el) return;
  const r = el.getBoundingClientRect();
  window.dispatchEvent(new CustomEvent(EVENTO_PULSO, { detail: { x: r.left + r.width / 2, y: r.top + r.height / 2 } }));
}

/**
 * Grade de pontos que respira devagar, acende perto do cursor e solta uma onda a cada coisa que o cliente escreve.
 * Com "reduzir movimento" ligado, a grade fica parada.
 */
export function Fundo() {
  const tela = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const cv = tela.current;
    const ctx = cv?.getContext("2d");
    if (!cv || !ctx) return;
    const reduz = matchMedia("(prefers-reduced-motion: reduce)").matches;
    let W = 0, H = 0, pts: [number, number][] = [], mx = -999, my = -999, ultimo = 0, quadro = 0;
    let pulsos: { x: number; y: number; t: number }[] = [];

    const desenhar = (t: number) => {
      ctx.clearRect(0, 0, W, H);
      const cx = W * 0.5, cy = H * 0.3;
      for (const [x, y] of pts) {
        let a = 0.06 + 0.07 * Math.max(0, Math.sin(Math.hypot(x - cx, y - cy) / 70 - t / 1100));
        const dm = Math.hypot(x - mx, y - my);
        if (dm < 170) a += 0.4 * (1 - dm / 170);
        for (const p of pulsos) {
          const raio = (t - p.t) * 0.6, k = Math.abs(Math.hypot(x - p.x, y - p.y) - raio);
          if (k < 28) a += 0.5 * (1 - k / 28) * Math.max(0, 1 - raio / 1000);
        }
        a = Math.min(a, 0.8);
        ctx.fillStyle = a > 0.18 ? `rgba(231,199,92,${a})` : `rgba(232,235,229,${a})`;
        ctx.fillRect(x - 1, y - 1, 2, 2);
      }
      pulsos = pulsos.filter((p) => (t - p.t) * 0.6 < 1000);
      if (!reduz) quadro = requestAnimationFrame(desenhar);
    };

    const medir = () => {
      const dpr = Math.min(devicePixelRatio || 1, 2);
      W = innerWidth;
      H = innerHeight;
      cv.width = W * dpr;
      cv.height = H * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      pts = [];
      const g = 26;
      for (let y = g / 2; y < H; y += g) for (let x = g / 2; x < W; x += g) pts.push([x, y]);
      if (reduz) desenhar(0);
    };
    const mover = (e: PointerEvent) => {
      mx = e.clientX;
      my = e.clientY;
    };
    const sair = () => {
      mx = my = -999;
    };
    const pulso = (e: Event) => {
      const agora = performance.now();
      if (reduz || agora - ultimo < 260) return;
      ultimo = agora;
      const { x, y } = (e as CustomEvent<{ x: number; y: number }>).detail;
      pulsos.push({ x, y, t: agora });
    };

    medir();
    addEventListener("resize", medir);
    addEventListener("pointermove", mover);
    document.addEventListener("pointerleave", sair);
    addEventListener(EVENTO_PULSO, pulso);
    if (!reduz) quadro = requestAnimationFrame(desenhar);
    return () => {
      cancelAnimationFrame(quadro);
      removeEventListener("resize", medir);
      removeEventListener("pointermove", mover);
      document.removeEventListener("pointerleave", sair);
      removeEventListener(EVENTO_PULSO, pulso);
    };
  }, []);

  return <canvas ref={tela} className="fundo" aria-hidden="true" />;
}
