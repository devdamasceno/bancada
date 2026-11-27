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
import { InstagramIcone, RoboFundo, WhatsAppIcone } from "@/components/Robo";

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
      address: {
        "@type": "PostalAddress",
        addressLocality: seo.cidade.nome,
        addressRegion: seo.cidade.estado,
        addressCountry: "BR",
      },
      areaServed: [
        { "@type": "City", name: seo.cidade.nome, containedInPlace: { "@type": "State", name: seo.cidade.estadoNome } },
        { "@type": "Country", name: seo.area },
      ],
      sameAs: [`https://instagram.com/${marca.instagram}`],
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

const instagram = `https://instagram.com/${marca.instagram}`;
const whatsapp = `https://wa.me/55${marca.whatsapp.replace(/\D/g, "")}?text=${encodeURIComponent(t.whatsappMensagem)}`;

function Hero() {
  return (
    <section className="largura" aria-labelledby="titulo">
      <div className="hero">
        <RoboFundo className="hero-robo" />
        <MarcasDeCorte />
        <div className="hero-texto">
          <p className="hero-selo">
            <i aria-hidden="true" />
            {t.selo}
          </p>
          <h1 id="titulo" className="titulo-hero">
            {t.titulo} <mark>{t.tituloMarca}</mark>
          </h1>
          <p className="hero-sub">
            {t.subtitulo} <strong>{t.subtituloDestaque}</strong>
          </p>
          <div className="acoes">
            <Link className="btn" href="/conversa">
              {t.botaoHero}
            </Link>
            <Link className="link" href="/portfolio">
              {t.botaoSecundario}
            </Link>
          </div>
          <p className="nota">{t.nota}</p>
          <p className="hero-siga">
            <a href={instagram} target="_blank" rel="noopener noreferrer">
              <InstagramIcone /> {t.siga.curto} <b>@{marca.instagram}</b>
            </a>
            <a href={whatsapp} target="_blank" rel="noopener noreferrer">
              <WhatsAppIcone /> {marca.whatsapp}
            </a>
          </p>
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
                      {s.inclui} {s.prazo === "mensal" ? "Todo mês." : `Pronto ${s.prazo.startsWith("no ") ? s.prazo : `em ${s.prazo}`}.`}
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
      <div className="dividido">
        <div className="dividido-lado" />
        <p className="nota">{t.comoFunciona.nota}</p>
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

function Siga() {
  return (
    <section className="secao largura" aria-labelledby="t-siga">
      <div className="siga">
        <RoboFundo className="siga-robo" />
        <div>
          <h2 id="t-siga" className="titulo-xl">
            {t.siga.titulo}
          </h2>
          <p className="apoio">{t.siga.texto}</p>
        </div>
        <div className="siga-acoes">
          <a className="btn" href={instagram} target="_blank" rel="noopener noreferrer">
            <InstagramIcone /> {t.siga.instagram}
          </a>
          <a className="btn btn-whats" href={whatsapp} target="_blank" rel="noopener noreferrer">
            <WhatsAppIcone /> {t.siga.whatsapp}
          </a>
        </div>
      </div>
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
        <Siga />
        <Fechamento />
      </main>
      <Rodape />
    </>
  );
}
