// Linguagem visual da marca: elementos de prova de gráfica (marcas de corte e barra de cores).

export function MarcasDeCorte() {
  return (
    <>
      <span className="corte corte-se" aria-hidden="true" />
      <span className="corte corte-sd" aria-hidden="true" />
      <span className="corte corte-ie" aria-hidden="true" />
      <span className="corte corte-id" aria-hidden="true" />
    </>
  );
}

const PROCESSO = ["#00A3E0", "#D4006F", "#FFE100", "#141414", "#7FD1EF", "#E97FB7", "#FFF080", "#8A8A8A"];

export function BarraDeCores({ cores = PROCESSO, fina = false }: { cores?: string[]; fina?: boolean }) {
  return (
    <div className={fina ? "barra-cores barra-cores-fina" : "barra-cores"} aria-hidden="true">
      {cores.map((c, i) => (
        <i key={i} style={{ background: c }} />
      ))}
    </div>
  );
}

/** Cabeçalho padrão de seção: título à esquerda, texto de apoio à direita. */
export function CabecaSecao({
  id,
  titulo,
  texto,
  nivel = "h2",
}: {
  id: string;
  titulo: string;
  texto: string;
  nivel?: "h1" | "h2";
}) {
  const Titulo = nivel;
  return (
    <div className="cabeca-secao">
      <Titulo id={id} className="titulo-xl">
        {titulo}
      </Titulo>
      <p>{texto}</p>
    </div>
  );
}
