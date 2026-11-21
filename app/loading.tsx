import { SimboloK } from "@/components/Marca";

/** Tela de carregamento entre páginas: o K da marca entrando em registro. */
export default function Carregando() {
  return (
    <div className="carregando" role="status" aria-live="polite">
      <span className="carregando-k">
        <SimboloK />
      </span>
      <span className="sr-only">Carregando…</span>
    </div>
  );
}
