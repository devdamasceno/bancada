import Image from "next/image";
import Link from "next/link";
import { Barlow_Condensed, Fraunces } from "next/font/google";
import { contexto } from "@/content/atendente";
import { depoimentos, landing as t, modelos } from "@/content/landing";
import { seo } from "@/content/seo";
import { formatarReais, marca, servicos } from "@/content/site";
import { BotaoPreferencias } from "@/components/BotaoPreferencias";
import { Fundo } from "@/components/Fundo";
import { BotaoWhatsapp, Logo, Topo } from "@/components/Marca";

// Fontes só dos modelos de site: cada negócio com a sua letra.
const fraunces = Fraunces({
  subsets: ["latin"],
  weight: "600",
  variable: "--f-doce",
  display: "swap",
});
const barlow = Barlow_Condensed({
  subsets: ["latin"],
  weight: "700",
  variable: "--f-barba",
  display: "swap",
});

const real = (v: string) => !!v && !v.includes("[SUBSTITUIR]");

// Fotos do topo da página: a grande (4:3) fica no alto à direita, a quadrada embaixo à esquerda.
const fotosHero = [
  {
    src: "/lp-image01.png",
    w: 1200,
    h: 896,
    alt: "Confeiteira sorrindo enquanto fotografa um bolo com o celular no balcão da padaria",
  },
  {
    src: "/lp-image02.png",
    w: 1024,
    h: 1024,
    alt: "Barbeiro com as mãos tatuadas mexendo no celular ao lado da cadeira da barbearia",
  },
];

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

function BotaoFita({ texto, apoio }: { texto: string; apoio: string }) {
  return (
    <Link className="fita-cta" href="/conversa">
      <b>{texto}</b>
      <span>{apoio}</span>
    </Link>
  );
}

function Modelo({ m }: { m: (typeof modelos)[number] }) {
  const foto = (
    <Image
      src={m.foto.src}
      alt={m.foto.alt}
      width={900}
      height={600}
      sizes="(max-width: 760px) 90vw, 40vw"
    />
  );
  return (
    <figure className={`lp-peca lp-${m.id}`}>
      <div className="lp-folha">
        <div className="lp-tela">
          <span className="lp-url">modelo: {m.rotulo.toLowerCase()}</span>
          {m.id === "pizzaria" && foto}
          {m.id === "confeitaria" && <div className="lp-foto-topo">{foto}</div>}
          <div
            className={
              m.id === "barbearia" || m.id === "fisioterapia"
                ? "lp-corpo lp-dividido"
                : "lp-corpo"
            }
          >
            {m.id === "fisioterapia" && foto}
            <div>
              <h3>{m.titulo}</h3>
              {m.precos.length > 0 && (
                <dl className="lp-tabela">
                  {m.precos.map(([nome, preco]) => (
                    <div key={nome}>
                      <dt>{nome}</dt>
                      <dd>{preco}</dd>
                    </div>
                  ))}
                </dl>
              )}
              {m.texto && <p>{m.texto}</p>}
              <span className="lp-mini-botao">{m.botao}</span>
            </div>
            {m.id === "barbearia" && foto}
          </div>
        </div>
      </div>
      <figcaption>
        <b>{m.rotulo}.</b> {m.legenda}
      </figcaption>
    </figure>
  );
}

export default function Home() {
  const duvidas = contexto.perguntasFrequentes.filter((p) => real(p.resposta));
  return (
    <>
      <Fundo />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: dadosEstruturados(duvidas) }}
      />
      <div className={`lp ${fraunces.variable} ${barlow.variable}`}>
        <Topo />

        <main id="conteudo">
          <section className="lp-hero" aria-labelledby="titulo">
            <div className="lp-hero-texto">
              <h1 id="titulo">
                {t.titulo}
                <span className="lp-preco">{t.linhaPreco}</span>
              </h1>
              <p className="lp-sub">
                {t.subtitulo} <strong>{t.subtituloDestaque}</strong>
              </p>
              <BotaoFita texto={t.botao} apoio={t.botaoApoio} />
              <ul className="lp-provas">
                {t.provas.map((p) => (
                  <li key={p}>{p}</li>
                ))}
              </ul>
            </div>
            {/* colagem: duas fotos dos modelos presas com fita, no espaço à direita do texto */}
            <div className="lp-hero-colagem">
              {fotosHero.map((f, i) => (
                <div
                  key={f.src}
                  className={`lp-hero-foto lp-hero-foto-${i + 1}`}
                >
                  <Image
                    src={f.src}
                    alt={f.alt}
                    width={f.w}
                    height={f.h}
                    sizes="(max-width: 860px) 80vw, 34vw"
                    loading="eager"
                    fetchPriority={i === 0 ? "high" : "auto"}
                  />
                </div>
              ))}
            </div>
          </section>

          <section className="lp-secao" aria-labelledby="t-modelos">
            <div className="lp-cabeca">
              <h2 id="t-modelos">{t.modelos.titulo}</h2>
              <p>{t.modelos.texto}</p>
            </div>
            <div className="lp-parede">
              {modelos.map((m) => (
                <Modelo key={m.id} m={m} />
              ))}
            </div>
            <div className="lp-repete">
              <BotaoFita texto={t.modelos.botao} apoio={t.modelos.botaoApoio} />
            </div>
          </section>

          <section className="lp-secao" aria-labelledby="t-depoimentos">
            <div className="lp-cabeca">
              <h2 id="t-depoimentos">{t.depoimentos.titulo}</h2>
              <p>{t.depoimentos.texto}</p>
            </div>
            <ul className="lp-depoimentos">
              {depoimentos.map((d) => (
                <li key={d.nome}>
                  <figure>
                    <blockquote>
                      <p>“{d.texto}”</p>
                    </blockquote>
                    <figcaption>
                      <span className="lp-dep-inicial" aria-hidden="true">
                        {d.nome[0]}
                      </span>
                      <span>
                        <b>{d.nome}</b>
                        <span>
                          {d.negocio}, {d.cidade}
                        </span>
                      </span>
                    </figcaption>
                  </figure>
                  <span className="lp-dep-servico">
                    {d.servico}
                    {d.teste && (
                      <span className="lp-dep-selo">{t.depoimentos.selo}</span>
                    )}
                  </span>
                </li>
              ))}
            </ul>
          </section>

          <section className="lp-secao" aria-labelledby="t-precos">
            <div className="lp-cabeca">
              <h2 id="t-precos">{t.precos.titulo}</h2>
              <p>{t.precos.texto}</p>
            </div>
            <ul className="lp-precos">
              {servicos.map((s) => (
                <li key={s.id}>
                  <h3>{s.nome}</h3>
                  <p>{s.inclui}</p>
                  <span className="lp-prazo">
                    {s.prazo === "mensal" ? "todo mês" : `pronto em ${s.prazo}`}
                  </span>
                  <span className="lp-valor">
                    <small>a partir de</small> {formatarReais(s.aPartirDe)}
                    {s.unidade && <small> {s.unidade}</small>}
                  </span>
                </li>
              ))}
            </ul>
            <p className="lp-nota">{t.precos.rodape}</p>
          </section>

          <section className="lp-secao lp-duas" aria-labelledby="t-como">
            <div>
              <h2 id="t-como">{t.comoFunciona.titulo}</h2>
              <ol className="lp-passos">
                {t.comoFunciona.passos.map((p) => (
                  <li key={p.titulo}>
                    <h3>{p.titulo}</h3>
                    <p>{p.texto}</p>
                  </li>
                ))}
              </ol>
            </div>
            {duvidas.length > 0 && (
              <div>
                <h2 id="t-duvidas">{t.duvidas.titulo}</h2>
                <div className="lp-duvidas">
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

          <section className="lp-fechamento" aria-labelledby="t-fechamento">
            <h2 id="t-fechamento">{t.fechamento.titulo}</h2>
            <p>{t.fechamento.texto}</p>
            <BotaoFita texto={t.botao} apoio={t.botaoApoio} />
          </section>
        </main>

        <footer className="lp-rodape">
          <div className="lp-rodape-marca">
            <Logo />
            {t.rodape.linhas.map((l) => (
              <p key={l}>{l}</p>
            ))}
            {(real(marca.cnpj) || real(marca.cidade)) && (
              <p>
                {[
                  real(marca.cnpj) && `CNPJ ${marca.cnpj}`,
                  real(marca.cidade) && marca.cidade,
                ]
                  .filter(Boolean)
                  .join(", ")}
              </p>
            )}
          </div>
          <nav className="lp-rodape-links" aria-label="Rodapé">
            <BotaoWhatsapp
              texto="Falar no WhatsApp"
              mensagem={t.whatsappMensagem}
            />
            {real(marca.email) && (
              <a href={`mailto:${marca.email}`}>{marca.email}</a>
            )}
            <Link href="/privacidade">{t.rodape.privacidade}</Link>
            <BotaoPreferencias rotulo={t.rodape.cookies} />
          </nav>
        </footer>
      </div>
    </>
  );
}
