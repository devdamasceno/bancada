"use client";

import { abrirPreferencias } from "@/lib/consent";

export function BotaoPreferencias({ rotulo }: { rotulo: string }) {
  return (
    <button type="button" className="botao botao-neutro" onClick={abrirPreferencias}>
      {rotulo}
    </button>
  );
}
