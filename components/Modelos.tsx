import Image from "next/image";
import { landing as t, modelos } from "@/content/landing";
import { CabecaSecao, MarcasDeCorte } from "@/components/Grafica";

/** Modelos demonstrativos por segmento (barbearia, confeitaria, clínica, delivery). */
export function Modelos() {
  return (
    <section className="secao largura" aria-labelledby="t-modelos">
      <CabecaSecao id="t-modelos" titulo={t.modelos.titulo} texto={t.modelos.texto} />
      <div className="modelos">
        {modelos.map((m) => (
          <figure key={m.id} className="modelo">
            <div className="modelo-foto">
              <MarcasDeCorte />
              <Image
                src={m.foto.src}
                alt={m.foto.alt}
                width={900}
                height={600}
                sizes="(max-width: 760px) 90vw, 40vw"
              />
            </div>
            <figcaption>
              <span className="modelo-rotulo">{m.rotulo}</span>
              <b>{m.titulo}</b>
              <span>{m.legenda}</span>
            </figcaption>
          </figure>
        ))}
      </div>
      <p className="nota">Modelos demonstrativos com fotos do Pexels (licença livre).</p>
    </section>
  );
}
