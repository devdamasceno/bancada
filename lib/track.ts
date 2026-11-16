"use client";

import { idVisitante, lerPreferencias } from "@/lib/consent";

/** Envia um evento de análise ao próprio servidor. Sem consentimento, não faz nada. */
export function registrar(evento: string, dados: Record<string, unknown> = {}) {
  if (!lerPreferencias()?.analise) return;
  const corpo = JSON.stringify({
    evento,
    dados,
    visitante: idVisitante(),
    pagina: location.pathname,
    origem: document.referrer || null,
    utm: Object.fromEntries(
      [...new URLSearchParams(location.search)].filter(([k]) => k.startsWith("utm_")),
    ),
  });
  const blob = new Blob([corpo], { type: "application/json" });
  if (!navigator.sendBeacon?.("/api/evento", blob)) {
    fetch("/api/evento", { method: "POST", body: corpo, keepalive: true }).catch(() => {});
  }
}
