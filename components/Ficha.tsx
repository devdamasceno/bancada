"use client";

import { useEffect, useRef, useState } from "react";
import { ficha as t, formatarReais, servicos } from "@/content/site";
import { CAMPOS_PROGRESSO, CAMPOS_TEXTO, camposPreenchidos, prontaParaEnviar, type Ficha as TFicha } from "@/lib/ficha";

type Props = {
  ficha: TFicha;
  valor: number;
  salvoEm: string | null;
  salvando: boolean;
  numeroPedido: string | null;
  /** Site de 1 página: link do Mercado Pago e a página para acompanhar. */
  pagamento?: { link: string; acompanhar: string } | null;
  enviando: boolean;
  erroEnvio: string | null;
  novidades: boolean;
  onNovidades: (v: boolean) => void;
  onEnviar: () => void;
};

export function Ficha(p: Props) {
  const [aberta, setAberta] = useState(false);
  const anterior = useRef(p.ficha);
  const [novos, setNovos] = useState<string[]>([]);

  // acende por um instante o campo que a IA acabou de preencher
  useEffect(() => {
    const antes = anterior.current;
    const mudou = [
      ...(p.ficha.servicos.join() !== antes.servicos.join() ? ["servicos"] : []),
      ...CAMPOS_TEXTO.filter((c) => p.ficha[c] !== antes[c]),
    ];
    anterior.current = p.ficha;
    if (!mudou.length) return;
    setNovos(mudou);
    const x = setTimeout(() => setNovos([]), 1300);
    return () => clearTimeout(x);
  }, [p.ficha]);

  const nomes = servicos.filter((s) => p.ficha.servicos.includes(s.id)).map((s) => s.nome);
  const valorDe = (c: string) => (c === "servicos" ? nomes.join(", ") : p.ficha[c as keyof TFicha]) as string | undefined;
  const campos = [...CAMPOS_PROGRESSO, "dominio", "observacoes"] as const;
  const pronta = prontaParaEnviar(p.ficha);

  return (
    <aside className={aberta ? "ficha aberta" : "ficha"} aria-label={t.titulo}>
      <header>
        <h2>{t.titulo}</h2>
        <span className="ficha-topo">
          <span className="rotulo">
            {camposPreenchidos(p.ficha)} de {CAMPOS_PROGRESSO.length}
          </span>
          <button
            type="button"
            className="ver"
            aria-expanded={aberta}
            aria-controls="ficha-campos"
            onClick={() => setAberta((a) => !a)}
          >
            {aberta ? t.fecharFicha : t.verFicha}
          </button>
        </span>
      </header>

      <p className={p.salvoEm ? "salvo rotulo ok" : "salvo rotulo"} aria-live="polite">
        {p.salvando ? t.salvando : p.salvoEm ? t.salvo(p.salvoEm) : t.vazio}
      </p>

      <dl id="ficha-campos">
        {campos.map((c) => {
          const v = valorDe(c);
          if ((c === "observacoes" || c === "dominio") && !v) return null;
          const classes = ["campo", `campo-${c}`, v ? "ok" : "", novos.includes(c) ? "novo" : ""].join(" ");
          return (
            <div key={c} className={classes}>
              <dt className="rotulo">{t.campos[c]}</dt>
              <dd>{v || "—"}</dd>
            </div>
          );
        })}
      </dl>

      <div className="estimativa">
        <span className="rotulo">{t.aPartirDe}</span>
        <b>{p.valor ? formatarReais(p.valor) : "—"}</b>
      </div>

      {p.numeroPedido ? (
        <div className="ficha-sucesso" role="status">
          <strong>{t.sucessoTitulo}</strong>
          {p.pagamento ? (
            <>
              <p>{t.sucessoPagar(p.numeroPedido)}</p>
              <a className="fechar" href={p.pagamento.link}>
                {t.pagar(p.valor ? formatarReais(p.valor) : "")}
              </a>
              <small className="ficha-dica">
                {t.pagarDica} <a href={p.pagamento.acompanhar}>{t.acompanhar}</a>
              </small>
            </>
          ) : (
            <p>{t.sucesso(p.numeroPedido)}</p>
          )}
        </div>
      ) : (
        <>
          <label className="marcacao ficha-novidades">
            <input type="checkbox" checked={p.novidades} onChange={(e) => p.onNovidades(e.target.checked)} />
            <span>{t.novidades}</span>
          </label>
          <button
            type="button"
            className="fechar"
            disabled={!pronta || p.enviando}
            aria-describedby={pronta ? undefined : "ficha-falta"}
            onClick={p.onEnviar}
          >
            {p.enviando ? t.enviando : t.enviar}
          </button>
          {!pronta && (
            <small id="ficha-falta" className="ficha-dica">
              {t.falta}
            </small>
          )}
          {p.erroEnvio && (
            <p className="erro" role="alert">
              {p.erroEnvio}
            </p>
          )}
          <small className="ficha-dica">{t.rodape}</small>
        </>
      )}
    </aside>
  );
}
