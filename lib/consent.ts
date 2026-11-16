"use client";

import { consentimento } from "@/content/site";

export type Preferencias = {
  analise: boolean;
  personalizacao: boolean;
  versao: string;
  data: string;
};

const COOKIE = "kriai_consent";
const VISITANTE = "kriai_vid";
const UM_ANO = 60 * 60 * 24 * 365;
export const EVENTO_MUDOU = "kriai:consentimento";
export const EVENTO_ABRIR = "kriai:abrir-preferencias";

function lerCookie(nome: string) {
  if (typeof document === "undefined") return null;
  const par = document.cookie.split("; ").find((c) => c.startsWith(`${nome}=`));
  return par ? decodeURIComponent(par.slice(nome.length + 1)) : null;
}

function gravarCookie(nome: string, valor: string, maxAge: number) {
  document.cookie = `${nome}=${encodeURIComponent(valor)}; Max-Age=${maxAge}; Path=/; SameSite=Lax${
    location.protocol === "https:" ? "; Secure" : ""
  }`;
}

/** Assinatura para useSyncExternalStore: avisa quando a escolha de cookies muda. */
export function assinarConsentimento(aviso: () => void) {
  window.addEventListener(EVENTO_MUDOU, aviso);
  return () => window.removeEventListener(EVENTO_MUDOU, aviso);
}

export function lerPreferencias(): Preferencias | null {
  const bruto = lerCookie(COOKIE);
  if (!bruto) return null;
  try {
    const p = JSON.parse(bruto) as Preferencias;
    // versão nova da política pede consentimento de novo
    return p.versao === consentimento.versao ? p : null;
  } catch {
    return null;
  }
}

export function salvarPreferencias(analise: boolean, personalizacao: boolean) {
  const p: Preferencias = {
    analise,
    personalizacao,
    versao: consentimento.versao,
    data: new Date().toISOString(),
  };
  gravarCookie(COOKIE, JSON.stringify(p), UM_ANO);
  if (!analise) gravarCookie(VISITANTE, "", 0);
  if (!personalizacao) {
    try {
      localStorage.removeItem("kriai_conversa");
    } catch {}
  }
  window.dispatchEvent(new CustomEvent(EVENTO_MUDOU, { detail: p }));
  return p;
}

/** Identificador anônimo do navegador. Só existe com consentimento de análise. */
export function idVisitante(): string | null {
  if (!lerPreferencias()?.analise) return null;
  let id = lerCookie(VISITANTE);
  if (!id) {
    id = crypto.randomUUID();
    gravarCookie(VISITANTE, id, UM_ANO);
  }
  return id;
}

export function abrirPreferencias() {
  window.dispatchEvent(new CustomEvent(EVENTO_ABRIR));
}
