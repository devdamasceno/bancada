import type { Metadata } from "next";
import Link from "next/link";
import { formatarReais, marca, servicos } from "@/content/site";
import { Topo } from "@/components/Marca";
import { Rodape } from "@/components/Rodape";

// Página local para a busca "criação de sites em Juiz de Fora".
// Só fatos da Kriai: preços e prazos vêm de content/site.ts.

const titulo = "Criação de sites em Juiz de Fora";
const descricao =
  "Criação de sites para pequenos negócios de Juiz de Fora (MG): landing page com botão de WhatsApp, no ar no mesmo dia, a partir de R$ 397. Pix ou cartão em até 3x.";

export const metadata: Metadata = {
  title: "Criação de sites em Juiz de Fora (MG)",
  description: descricao,
  alternates: { canonical: "/criacao-de-sites-juiz-de-fora" },
  openGraph: {
    title: `${titulo} | ${marca.nome}`,
    description: descricao,
    url: "/criacao-de-sites-juiz-de-fora",
    locale: "pt_BR",
    type: "website",
  },
};

const site = servicos.find((s) => s.id === "site") ?? servicos[0];

const duvidas = [
  {
    pergunta: "Quanto custa criar um site em Juiz de Fora?",
    resposta: `Na ${marca.nome}, a landing page (site de uma página) sai a partir de ${formatarReais(site.aPartirDe)}, com botão de WhatsApp, formulário, versão para celular e uma rodada de ajustes. O preço aparece na tela antes de você decidir.`,
  },
  {
    pergunta: "Em quanto tempo o site fica pronto?",
    resposta: "A landing page fica no ar no mesmo dia em que o pedido é pago.",
  },
  {
    pergunta: "Preciso ir até um escritório?",
    resposta: `Não. A ${marca.nome} é de Juiz de Fora e o atendimento é 100% online: você monta o plano no site, conversa pelo WhatsApp e paga com Pix ou cartão em até 3x.`,
  },
  {
    pergunta: "O site aparece no Google?",
    resposta:
      "O site já sai pronto para o Google ler, com título, descrição e versão para celular. Para aparecer no mapa quando alguém busca perto de você, o ideal é ter também o Perfil da Empresa no Google, que a Kriai também cria e cuida.",
  },
  {
    pergunta: "E o domínio próprio (.com.br)?",
    resposta:
      "O site já sai hospedado em seunegocio.kriai.online. Se quiser um endereço .com.br, ele fica no seu nome no Registro.br, por cerca de R$ 40 por ano.",
  },
];

function dados() {
  const url = `https://${marca.dominio}`;
  return JSON.stringify({
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "Service",
        "@id": `${url}/criacao-de-sites-juiz-de-fora#servico`,
        name: titulo,
        serviceType: "Criação de sites",
        provider: { "@id": `${url}/#empresa` },
        areaServed: { "@type": "City", name: "Juiz de Fora", containedInPlace: { "@type": "State", name: "Minas Gerais" } },
        offers: {
          "@type": "Offer",
          priceCurrency: "BRL",
          price: site.aPartirDe,
          priceSpecification: { "@type": "PriceSpecification", minPrice: site.aPartirDe, priceCurrency: "BRL" },
        },
      },
      {
        "@type": "FAQPage",
        mainEntity: duvidas.map((d) => ({
          "@type": "Question",
          name: d.pergunta,
          acceptedAnswer: { "@type": "Answer", text: d.resposta },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: marca.nome, item: `${url}/` },
          { "@type": "ListItem", position: 2, name: titulo, item: `${url}/criacao-de-sites-juiz-de-fora` },
        ],
      },
    ],
  }).replace(/</g, "\\u003c");
}

export default function CriacaoDeSitesJuizDeFora() {
  return (
    <>
      <Topo />
      <main className="politica">
        <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: dados() }} />
        <p>
          <Link href="/">Voltar ao início</Link>
        </p>
        <h1>{titulo}</h1>
        <p>
          A {marca.nome} é uma agência digital de Juiz de Fora (MG) que cria sites para pequenos
          negócios: barbearias, salões, confeitarias, restaurantes, clínicas, consultórios,
          oficinas, lojas e profissionais autônomos. Do Centro ao São Mateus, do Benfica à
          Cascatinha, o seu cliente procura no Google antes de comprar. O site é o lugar onde ele
          encontra preço, horário, endereço e o botão para falar com você.
        </p>
        <p>
          <Link className="btn" href="/conversa">
            Montar meu site
          </Link>{" "}
          <Link className="link" href="/portfolio">
            Ver modelos
          </Link>
        </p>

        <h2>O que vem no site</h2>
        <ul>
          <li>Site de uma página (landing page) com a cara do seu negócio</li>
          <li>Botão de WhatsApp para o cliente falar com você na hora</li>
          <li>Formulário de contato e versão para celular</li>
          <li>Uma rodada de ajustes incluída</li>
          <li>Hospedagem pronta em seunegocio.kriai.online, no ar no mesmo dia</li>
        </ul>

        <h2>Preços</h2>
        <ul>
          {servicos.map((s) => (
            <li key={s.id}>
              <strong>{s.nome}</strong>: a partir de {formatarReais(s.aPartirDe)}
              {s.unidade ? ` ${s.unidade}` : ""}. {s.inclui}
            </li>
          ))}
        </ul>
        <p>Pix ou cartão em até 3x. Projeto personalizado recebe orçamento sem compromisso.</p>

        <h2>Como funciona</h2>
        <ol>
          <li>Você conta do seu negócio no chat do site, com a Kria, nossa assistente.</li>
          <li>A Kria monta o plano com o visual, os textos e o preço na tela.</li>
          <li>Você paga com Pix ou cartão e o site vai para o ar no mesmo dia.</li>
        </ol>

        <h2>Perguntas frequentes</h2>
        {duvidas.map((d) => (
          <section key={d.pergunta}>
            <h3>{d.pergunta}</h3>
            <p>{d.resposta}</p>
          </section>
        ))}

        <h2>Fale com a {marca.nome}</h2>
        <p>
          Atendimento 100% online, a partir de {marca.cidade}, para Juiz de Fora e todo o Brasil.
          WhatsApp {marca.whatsapp} · Instagram @{marca.instagram}
        </p>
        <p>
          <Link className="btn" href="/conversa">
            Montar meu site
          </Link>
        </p>
      </main>
      <Rodape />
    </>
  );
}
