import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { marca } from "@/content/site";
import { Topo } from "@/components/Marca";
import { Rodape } from "@/components/Rodape";
import { obterEstadoPedido, usandoArquivoLocal } from "@/lib/db";

export const metadata: Metadata = { title: "Seu pedido", robots: { index: false, follow: false } };
export const dynamic = "force-dynamic";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/** Página do pedido: o cliente volta do Mercado Pago para cá e acompanha pagamento, site e domínio. */
export default async function Pedido({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ status?: string; collection_status?: string }>;
}) {
  const { id } = await params;
  const q = await searchParams;
  if (!UUID.test(id) || usandoArquivoLocal()) notFound();
  const p = await obterEstadoPedido(id);
  if (!p || p.status !== "enviado") notFound();

  const voltouAprovado = (q.collection_status ?? q.status) === "approved";
  const pago = p.pagamentoStatus === "aprovado";
  const processando = !pago && voltouAprovado;
  const provisorio = p.siteSlug ? `${p.siteSlug}.kriai.online` : null;
  const final = p.siteStatus === "publicado" || p.pagamentoStatus === "estornado";

  const etapas = [
    { nome: "Pedido enviado", feito: true },
    { nome: "Pagamento aprovado", feito: pago },
    { nome: "Site em produção", feito: pago && (p.siteStatus === "gerando" || p.siteStatus === "publicado") },
    { nome: "Site no ar", feito: p.siteStatus === "publicado" },
  ];

  return (
    <>
      {!final && <meta httpEquiv="refresh" content="20" />}
      <Topo semCta />
      <main className="politica pedido">
        <p className="rotulo">Pedido nº {p.numero}</p>
        <h1>
          {p.siteStatus === "publicado"
            ? "Seu site está no ar 🚀"
            : pago
              ? "Pagamento confirmado. Seu site está sendo feito."
              : processando
                ? "Pagamento recebido, confirmando…"
                : p.pagamentoStatus === "recusado"
                  ? "O pagamento não foi aprovado"
                  : "Falta só o pagamento"}
        </h1>

        <ol className="pedido-etapas">
          {etapas.map((e) => (
            <li key={e.nome} className={e.feito ? "ok" : ""}>
              {e.feito ? "✓ " : ""}
              {e.nome}
            </li>
          ))}
        </ol>

        {!pago && p.mpLink && (
          <>
            <p>
              {p.pagamentoStatus === "recusado"
                ? "Você pode tentar de novo com outro cartão ou com Pix."
                : processando
                  ? "O Mercado Pago está confirmando. Esta página se atualiza sozinha."
                  : `Site de 1 página por R$ ${p.valorCobrado}, com Pix ou cartão em até 3x. Assim que o pagamento for aprovado, começamos.`}
            </p>
            {!processando && (
              <p>
                <a className="botao" href={p.mpLink}>
                  Pagar com Mercado Pago
                </a>
              </p>
            )}
          </>
        )}

        {pago && p.siteStatus !== "publicado" && (
          <p>
            Ele vai aparecer primeiro em <b>{provisorio}</b>, para você conferir e pedir o ajuste incluído. Avisamos por e-mail
            {p.ficha.whatsapp ? " e WhatsApp" : ""} quando ficar pronto. Esta página se atualiza sozinha.
          </p>
        )}

        {p.siteStatus === "publicado" && p.siteUrl && (
          <p>
            <a className="botao" href={p.siteUrl}>
              Ver meu site
            </a>
          </p>
        )}

        {p.dominio && (
          <>
            <h2>Seu domínio: {p.dominio}</h2>
            {p.dominioStatus === "apontado" ? (
              <p>Tudo certo: o site já responde em {p.dominio}.</p>
            ) : p.dominioStatus === "livre" ? (
              <p>
                Está livre. Registre em <a href="https://registro.br">registro.br</a> no seu CPF ou CNPJ (cerca de R$ 40 por
                ano, pago direto ao Registro.br) e responda o e-mail do pedido avisando. A gente aponta o site para ele. O domínio
                fica no seu nome.
              </p>
            ) : p.dominioStatus === "ocupado" || p.dominioStatus === "do_cliente" ? (
              <p>
                Esse endereço já está registrado. Se ele é seu, responda o e-mail do pedido que passamos o que mudar no
                Registro.br. Se não é, escolha outro nome que a gente confere.
              </p>
            ) : (
              <p>Ainda vamos conferir se ele está livre e te avisamos.</p>
            )}
          </>
        )}

        <p className="rotulo">
          Dúvidas: {marca.email}
        </p>
      </main>
      <Rodape />
    </>
  );
}
