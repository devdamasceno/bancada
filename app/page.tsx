import Image from "next/image";
import Link from "next/link";
import { Barlow_Condensed, Fraunces } from "next/font/google";
import { contexto } from "@/content/atendente";
import { landing as t, modelos } from "@/content/landing";
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

function BotaoFita({ texto, apoio }: { texto: string; apoio: string }) {
  return (
    <Link className="fita-cta" href="/conversa">
      <b>{texto}</b>
      <span>{apoio}</span>
    </Link>
  );
}

function Modelo({
  m,
  prioridade,
}: {
  m: (typeof modelos)[number];
  prioridade?: boolean;
}) {
  const foto = (
    <Image
      src={m.foto.src}
      alt={m.foto.alt}
      width={900}
      height={600}
      sizes="(max-width: 760px) 90vw, 40vw"
      priority={prioridade}
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
      <div className={`lp ${fraunces.variable} ${barlow.variable}`}>
        <Topo>
          <BotaoWhatsapp mensagem={t.whatsappMensagem} />
        </Topo>

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
                    priority
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
              {modelos.map((m, i) => (
                <Modelo key={m.id} m={m} prioridade={i === 0} />
              ))}
            </div>
            <div className="lp-repete">
              <BotaoFita texto={t.modelos.botao} apoio={t.modelos.botaoApoio} />
            </div>
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
