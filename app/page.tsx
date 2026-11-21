import Link from "next/link";
import { contexto } from "@/content/atendente";
import { landing as t } from "@/content/landing";
import { seo } from "@/content/seo";
import { formatarReais, marca, servicos } from "@/content/site";
import { Campanhas, Fechamento } from "@/components/Campanhas";
import { BarraDeCores, MarcasDeCorte } from "@/components/Grafica";
import { Modelos } from "@/components/Modelos";
import { Topo } from "@/components/Marca";
import { Rodape } from "@/components/Rodape";

const real = (v: string) => !!v && !v.includes("[SUBSTITUIR]");

/**
 * Dados estruturados (schema.org) para o Google entender quem é a empresa, o que vende, por quanto,
 * e mostrar as perguntas frequentes direto no resultado da busca.
 */
function dadosEstruturados(duvidas: { pergunta: string; resposta: string }[]) {
  const url = `https://${marca.dominio}`;
  const grafo: Record<string, unknown>[] = [
    {
      "@type": "WebSite",
      "@id": `${url}/#site`,
      url,
      name: marca.nome,
      inLanguage: "pt-BR",
      publisher: { "@id": `${url}/#empresa` },
    },
    {
      "@type": "ProfessionalService",
      "@id": `${url}/#empresa`,
      name: marca.nome,
      url,
      logo: `${url}/icon.svg`,
      image: `${url}/opengraph-image`,
      description: seo.descricao,
      areaServed: { "@type": "Country", name: seo.area },
      priceRange: `${formatarReais(Math.min(...servicos.map((s) => s.aPartirDe)))}+`,
      ...(real(marca.email) ? { email: marca.email } : {}),
      ...(marca.whatsapp
        ? { telephone: `+55${marca.whatsapp.replace(/\D/g, "")}` }
        : {}),
      hasOfferCatalog: {
        "@type": "OfferCatalog",
        name: "Serviços",
        itemListElement: servicos.map((s) => ({
          "@type": "Offer",
          priceCurrency: "BRL",
          price: s.aPartirDe,
          priceSpecification: {
            "@type": "PriceSpecification",
            minPrice: s.aPartirDe,
            priceCurrency: "BRL",
          },
          itemOffered: {
            "@type": "Service",
            name: s.nome,
            description: s.inclui,
            areaServed: seo.area,
          },
        })),
      },
    },
  ];
  if (duvidas.length)
    grafo.push({
      "@type": "FAQPage",
      mainEntity: duvidas.map((d) => ({
        "@type": "Question",
        name: d.pergunta,
        acceptedAnswer: { "@type": "Answer", text: d.resposta },
      })),
    });
  // escapa "<" para o JSON não fechar a tag <script> por engano
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": grafo,
  }).replace(/</g, "\\u003c");
}

function Hero() {
  return (
    <section className="largura" aria-labelledby="titulo">
      <div className="hero">
        <MarcasDeCorte />
        <div>
          <h1 id="titulo" className="titulo-hero">
            {t.titulo}
          </h1>
          <p className="hero-sub">
            {t.subtitulo} <strong>{t.subtituloDestaque}</strong>
          </p>
          <div className="acoes">
            <Link className="btn" href="/conversa">
              {t.botao}
            </Link>
            <Link className="link" href="/portfolio">
              {t.botaoSecundario}
            </Link>
          </div>
          <p className="nota">{t.nota}</p>
        </div>

        <div
          className="pecas"
          role="img"
          aria-label="Peças de campanha demonstrativas: um story de confeitaria e o Perfil no Google de uma barbearia, sobre a letra K impressa em ciano, magenta e amarelo"
        >
          <div className="k-grande" aria-hidden="true">
            <span className="k-c">K</span>
            <span className="k-m">K</span>
            <span className="k-y">K</span>
          </div>
          <span className="pecas-rotulo">{t.pecasRotulo}</span>
          <div className="story">
            <div className="story-barras">
              <i />
              <i />
              <i />
            </div>
            <small>Confeitaria do bairro</small>
            <strong>Bolo de pote saindo agora</strong>
            <span className="story-botao">Pedir no WhatsApp</span>
          </div>
          <div className="gcard">
            <b>Barbearia do bairro</b>
            <span>Barbearia, aberta até 20h</span>
            <div className="gcard-botoes">
              <i>WhatsApp</i>
              <i>Rota</i>
              <i>Site</i>
            </div>
          </div>
        </div>
      </div>
      <BarraDeCores />
    </section>
  );
}

function Precos() {
  return (
    <section className="secao largura" id="precos" aria-labelledby="t-precos">
      <div className="dividido">
        <div className="dividido-lado">
          <h2 id="t-precos" className="titulo-xl">
            {t.precos.titulo}
          </h2>
          <p className="apoio">{t.precos.texto}</p>
        </div>
        <div>
          <table className="tabela-precos">
            <caption className="sr-only">Preços de entrada dos serviços da {marca.nome}</caption>
            <tbody>
              {servicos.map((s) => (
                <tr key={s.id}>
                  <th scope="row">
                    {s.nome}
                    <small>
                      {s.inclui} {s.prazo === "mensal" ? "Todo mês." : `Pronto em ${s.prazo}.`}
                    </small>
                  </th>
                  <td>
                    <em>a partir de</em> {formatarReais(s.aPartirDe)}
                    {s.unidade && <small>{s.unidade}</small>}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="nota">{t.precos.rodape}</p>
        </div>
      </div>
    </section>
  );
}

function ComoFunciona({ duvidas }: { duvidas: { pergunta: string; resposta: string }[] }) {
  return (
    <section className="secao largura" aria-labelledby="t-como">
      <div className="dividido">
        <div className="dividido-lado">
          <h2 id="t-como" className="titulo-xl">
            {t.comoFunciona.titulo}
          </h2>
        </div>
        <ol className="passos">
          {t.comoFunciona.passos.map((p) => (
            <li key={p.titulo}>
              <h3>{p.titulo}</h3>
              <p>{p.texto}</p>
            </li>
          ))}
        </ol>
      </div>
      {duvidas.length > 0 && (
        <div className="dividido duvidas-bloco">
          <div className="dividido-lado">
            <h2 id="t-duvidas" className="titulo-lg">
              {t.duvidas.titulo}
            </h2>
          </div>
          <div className="duvidas">
            {duvidas.map((d) => (
              <details key={d.pergunta}>
                <summary>{d.pergunta}</summary>
                <p>{d.resposta}</p>
              </details>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}

export default function Home() {
  const duvidas = contexto.perguntasFrequentes.filter((p) => real(p.resposta));
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: dadosEstruturados(duvidas) }} />
      <Topo />
      <main id="conteudo">
        <Hero />
        <Precos />
        <Campanhas />
        <Modelos />
        <ComoFunciona duvidas={duvidas} />
        <Fechamento />
      </main>
      <Rodape />
    </>
  );
}
