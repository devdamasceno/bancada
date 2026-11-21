import Image from "next/image";
import Link from "next/link";
import { campanhas, type Campanha } from "@/content/campanhas";
import { landing as t } from "@/content/landing";
import { BarraDeCores, CabecaSecao, MarcasDeCorte } from "@/components/Grafica";

function MiniaturaJoaoBala() {
  return (
    <div className="mini-jb">
      <div className="mini-jb-nav">
        <b />
        <span>João Bala</span>
        <u>Fale comigo</u>
      </div>
      <p className="mini-jb-titulo">
        Seu plano de compra, bem pensado do começo ao fim. <span>Com João Bala.</span>
      </p>
      <div className="mini-jb-cotas">
        {Array.from({ length: 40 }, (_, i) => (
          <i key={i} className={i === 27 ? "sua" : undefined} />
        ))}
      </div>
    </div>
  );
}

function MiniaturaPersonal() {
  const semana = [55, 80, 40, 92, 60, 70];
  return (
    <div className="mini-pt">
      <div className="mini-pt-nav">
        <span>PERSONAL</span>
        <u>Agendar avaliação</u>
      </div>
      <p className="mini-pt-titulo">
        Treino com método, <span>acompanhado de perto.</span>
      </p>
      <div className="mini-pt-semana">
        {semana.map((h, i) => (
          <i key={i} className={i % 2 ? "ativo" : undefined} style={{ height: `${h}%` }} />
        ))}
      </div>
    </div>
  );
}

const DESCRICAO: Record<Campanha["miniatura"], string> = {
  "joao-bala":
    "Miniatura da landing page de João Bala, em azul-cobalto, com um grupo de cotas e a cota do cliente destacada em verde-limão",
  personal:
    "Miniatura ilustrativa de landing page de personal trainer, fundo grafite e barras laranja da semana de treinos",
};

function Caso({ c, invertido }: { c: Campanha; invertido: boolean }) {
  return (
    <article className={invertido ? "caso caso-invertido" : "caso"}>
      <div className="prova">
        <MarcasDeCorte />
        {c.imagem ? (
          <div className="prova-tela">
            <Image
              src={c.imagem.src}
              alt={c.imagem.alt}
              width={c.imagem.largura}
              height={c.imagem.altura}
              sizes="(max-width: 900px) 92vw, 640px"
            />
          </div>
        ) : (
          <div className="prova-tela" role="img" aria-label={DESCRICAO[c.miniatura]}>
            {c.miniatura === "joao-bala" ? <MiniaturaJoaoBala /> : <MiniaturaPersonal />}
          </div>
        )}
        <BarraDeCores cores={c.cores} fina />
        {c.ilustrativa && (
          <p className="prova-nota">Miniatura ilustrativa: entra a captura real quando o link estiver no ar.</p>
        )}
      </div>
      <div>
        <h3 className="titulo-lg">{c.titulo}</h3>
        <dl className="ficha-tecnica">
          <dt>Cliente</dt>
          <dd>{c.cliente}</dd>
          <dt>Objetivo</dt>
          <dd>{c.objetivo}</dd>
          <dt>Peças</dt>
          <dd>{c.pecas}</dd>
        </dl>
        {c.link ? (
          <a className="link" href={c.link} target="_blank" rel="noopener">
            {c.rotuloLink}
          </a>
        ) : (
          <p className="apoio-escuro">Link em breve.</p>
        )}
      </div>
    </article>
  );
}

/** Seção "Em cartaz": campanhas reais em formato de prova de gráfica com ficha técnica. */
export function Campanhas({ comoPagina = false }: { comoPagina?: boolean }) {
  return (
    <section className="secao secao-escura" id="campanhas" aria-labelledby="t-campanhas">
      <div className="largura">
        <CabecaSecao
          id="t-campanhas"
          titulo={t.campanhas.titulo}
          texto={t.campanhas.texto}
          nivel={comoPagina ? "h1" : "h2"}
        />
        {campanhas.map((c, i) => (
          <Caso key={c.id} c={c} invertido={i % 2 === 1} />
        ))}
      </div>
    </section>
  );
}

/** Faixa amarela de fechamento que leva à conversa com a Kria. */
export function Fechamento() {
  return (
    <section className="secao-curta largura" aria-labelledby="t-fechamento">
      <div className="faixa-cta">
        <div>
          <h2 id="t-fechamento" className="titulo-lg">
            {t.fechamento.titulo}
          </h2>
          <p>{t.fechamento.texto}</p>
        </div>
        <Link className="btn" href="/conversa">
          {t.botao}
        </Link>
      </div>
    </section>
  );
}
