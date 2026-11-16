import { marca } from "@/content/site";

/** Tela de carregamento entre páginas: a logo em fita pulsando no centro. */
export default function Carregando() {
  return (
    <div className="carregando" role="status" aria-live="polite">
      <span className="carregando-logo" aria-hidden="true">
        {marca.nome}
      </span>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
