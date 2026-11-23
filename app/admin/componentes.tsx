"use client";

import { useActionState, useState } from "react";
import { emailCliente, entrar, gerarSiteAgora, reavaliar, reenviarEmail, sair, type EstadoAcao, type EstadoEntrar } from "./acoes";

export function FormEntrar() {
  const [estado, acao, pendente] = useActionState<EstadoEntrar, FormData>(entrar, {});
  return (
    <form action={acao} className="adm-form">
      <label htmlFor="senha" className="rotulo">
        Senha
      </label>
      <input id="senha" name="senha" type="password" autoComplete="current-password" required autoFocus />
      <button className="botao adm-botao-fita" disabled={pendente}>
        {pendente ? "Entrando…" : "Entrar"}
      </button>
      {estado.erro && (
        <p className="adm-erro" role="alert">
          {estado.erro}
        </p>
      )}
    </form>
  );
}

export function BotaoSair() {
  return (
    <form action={sair}>
      <button className="botao botao-neutro adm-pequeno">Sair</button>
    </form>
  );
}

const ACOES = { reavaliar, reenviar: reenviarEmail, cliente: emailCliente, site: gerarSiteAgora };

export function BotaoAcao({
  id,
  tipo,
  rotulo,
  rotuloPendente,
}: {
  id: string;
  tipo: "reavaliar" | "reenviar" | "cliente" | "site";
  rotulo: string;
  rotuloPendente: string;
}) {
  const [estado, acao, pendente] = useActionState<EstadoAcao, FormData>(ACOES[tipo], {});
  return (
    <form action={acao} className="adm-acao">
      <input type="hidden" name="id" value={id} />
      <button className="botao botao-neutro adm-pequeno" disabled={pendente}>
        {pendente ? rotuloPendente : rotulo}
      </button>
      {(estado.ok || estado.erro) && (
        <span className={estado.erro ? "adm-erro" : "adm-ok"} role="status">
          {estado.ok ?? estado.erro}
        </span>
      )}
    </form>
  );
}

export function Copiar({ texto }: { texto: string }) {
  const [feito, setFeito] = useState(false);
  return (
    <button
      type="button"
      className="botao botao-neutro adm-pequeno"
      onClick={async () => {
        try {
          await navigator.clipboard.writeText(texto);
          setFeito(true);
          setTimeout(() => setFeito(false), 2000);
        } catch {
          // navegador sem permissão: o texto continua visível para copiar à mão
        }
      }}
    >
      {feito ? "Copiado" : "Copiar"}
    </button>
  );
}
