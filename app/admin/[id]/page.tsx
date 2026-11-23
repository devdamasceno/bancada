import { Fragment, Suspense } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ficha as rotulos, servicos } from "@/content/site";
import { exigirAdmin } from "@/lib/admin";
import { obterEstadoPedido, obterLead } from "@/lib/db";
import { linkWhatsApp } from "@/lib/notificacao";
import { BotaoAcao, Copiar } from "../componentes";
import { dataHora, reais, ROTULO_SITUACAO, ROTULO_TEMPERATURA } from "../formato";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default function PaginaLead({ params }: PageProps<"/admin/[id]">) {
  return (
    <main className="adm-conteudo">
      <p>
        <Link href="/admin" className="rotulo">
          ← Contatos
        </Link>
      </p>
      <Suspense fallback={<p className="rotulo">Carregando…</p>}>
        <Detalhe params={params} />
      </Suspense>
    </main>
  );
}

async function Detalhe({ params }: { params: PageProps<"/admin/[id]">["params"] }) {
  await exigirAdmin();
  const { id } = await params;
  if (!UUID.test(id)) notFound();
  const [lead, pedido] = await Promise.all([obterLead(id), obterEstadoPedido(id)]);
  if (!lead) notFound();

  const f = lead.ficha;
  const av = lead.avaliacao;
  const plano = servicos.filter((s) => f.servicos.includes(s.id)).map((s) => s.nome);
  const campos = (Object.keys(rotulos.campos) as (keyof typeof rotulos.campos)[]).filter((c) => c !== "servicos");

  return (
    <>
      <div className="adm-cabeca">
        <div>
          <h1>{f.nome || "Sem nome"}</h1>
          <p className="adm-sub">
            {[f.negocio, f.cidade].filter(Boolean).join(" · ") || "Negócio não informado"}
          </p>
        </div>
        <span className={`adm-situacao s-${lead.situacao}`}>
          {ROTULO_SITUACAO[lead.situacao]}
          {lead.numero ? ` · nº ${lead.numero}` : ""}
        </span>
      </div>

      {f.whatsapp && (
        <p>
          <a className="botao adm-botao-zap" href={linkWhatsApp(f.whatsapp, av?.mensagem_sugerida)} target="_blank" rel="noreferrer">
            Responder no WhatsApp{av ? " com a mensagem sugerida" : ""}
          </a>
        </p>
      )}

      <section className="adm-cartao" aria-labelledby="t-avaliacao">
        <div className="adm-cartao-cabeca">
          <h2 id="t-avaliacao">Avaliação do lead</h2>
          <BotaoAcao id={lead.id} tipo="reavaliar" rotulo={av ? "Avaliar de novo" : "Avaliar agora"} rotuloPendente="Avaliando…" />
        </div>
        {av ? (
          <>
            <p className="adm-placar">
              <span className={`adm-nota grande t-${av.temperatura}`}>
                {av.nota}
                <small>{ROTULO_TEMPERATURA[av.temperatura]}</small>
              </span>
              <span>{av.resumo}</span>
            </p>
            <p>
              <strong>Próximo passo:</strong> {av.proximo_passo}
            </p>
            <div className="adm-colunas">
              {av.pontos_fortes.length > 0 && (
                <div>
                  <h3 className="rotulo">Pontos fortes</h3>
                  <ul>
                    {av.pontos_fortes.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
              {av.alertas.length > 0 && (
                <div>
                  <h3 className="rotulo">Alertas</h3>
                  <ul>
                    {av.alertas.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
            <div className="adm-sugerida">
              <div className="adm-cartao-cabeca">
                <h3 className="rotulo">Mensagem sugerida</h3>
                <Copiar texto={av.mensagem_sugerida} />
              </div>
              <p>{av.mensagem_sugerida}</p>
            </div>
            <p className="rotulo">Avaliado em {dataHora(lead.avaliadaEm)}</p>
          </>
        ) : (
          <p className="adm-vazio">Ainda sem avaliação. Pedidos enviados são avaliados sozinhos; os demais, pelo botão.</p>
        )}
      </section>

      <section className="adm-cartao" aria-labelledby="t-ficha">
        <h2 id="t-ficha">Ficha</h2>
        <dl className="adm-ficha">
          <dt>Plano</dt>
          <dd>
            {plano.join(" + ") || "—"} {plano.length > 0 && <span className="rotulo">a partir de {reais(lead.valorMinimo)}</span>}
          </dd>
          {campos.map((c) => (
            <Fragment key={c}>
              <dt>{rotulos.campos[c]}</dt>
              <dd>{f[c] || <span className="adm-apagado">não informado</span>}</dd>
            </Fragment>
          ))}
          <dt>Aceita novidades</dt>
          <dd>{lead.aceitaNovidades ? "Sim" : "Não"}</dd>
        </dl>
      </section>

      <section className="adm-cartao" aria-labelledby="t-conversa">
        <h2 id="t-conversa">Conversa</h2>
        <ol className="adm-conversa">
          {lead.mensagens.map((m, i) => (
            <li key={i} className={m.papel === "cliente" ? "de-cliente" : "de-ia"}>
              <span className="rotulo">
                {m.papel === "cliente" ? f.nome || "Cliente" : "Kria"} · {dataHora(m.em)}
              </span>
              <p>{m.texto}</p>
            </li>
          ))}
        </ol>
      </section>

      <section className="adm-cartao" aria-labelledby="t-origem">
        <h2 id="t-origem">Origem e e-mails</h2>
        <dl className="adm-ficha">
          <dt>Começou</dt>
          <dd>{dataHora(lead.criadaEm)}</dd>
          <dt>Última mensagem</dt>
          <dd>{dataHora(lead.atualizadaEm)}</dd>
          <dt>Pedido enviado</dt>
          <dd>{dataHora(lead.enviadaEm)}</dd>
          <dt>Veio de</dt>
          <dd>{lead.origem || "acesso direto"}</dd>
          {Object.keys(lead.utm).length > 0 && (
            <>
              <dt>Campanha</dt>
              <dd>
                {Object.entries(lead.utm)
                  .map(([k, v]) => `${k.replace("utm_", "")}: ${v}`)
                  .join(" · ")}
              </dd>
            </>
          )}
          <dt>Dispositivo</dt>
          <dd>{lead.dispositivo || "—"}</dd>
          <dt>Confirmação ao cliente</dt>
          <dd>
            {lead.emailClienteEm ? (
              `enviada em ${dataHora(lead.emailClienteEm)} para ${f.email}`
            ) : !f.email ? (
              <span className="adm-apagado">cliente não deu e-mail</span>
            ) : lead.situacao !== "enviado" ? (
              <span className="adm-apagado">só depois que o pedido for enviado</span>
            ) : (
              <BotaoAcao id={lead.id} tipo="cliente" rotulo="Enviar confirmação ao cliente" rotuloPendente="Enviando…" />
            )}
          </dd>
          {pedido?.pagamentoStatus && (
            <>
              <dt>Pagamento</dt>
              <dd>
                {pedido.pagamentoStatus === "aprovado"
                  ? `aprovado${pedido.pagoEm ? ` em ${dataHora(pedido.pagoEm)}` : ""} · R$ ${pedido.valorCobrado}`
                  : pedido.pagamentoStatus}
              </dd>
              <dt>Site</dt>
              <dd>
                {pedido.siteUrl && pedido.siteStatus === "publicado" ? (
                  <a href={pedido.siteUrl} target="_blank" rel="noopener noreferrer">
                    {pedido.siteUrl}
                  </a>
                ) : (
                  <span className="adm-apagado">{pedido.siteStatus ?? "aguardando pagamento"}</span>
                )}
                {pedido.dominio && <span className="adm-apagado"> · domínio {pedido.dominio}</span>}
                {pedido.pagamentoStatus === "aprovado" && pedido.siteStatus !== "gerando" && (
                  <BotaoAcao
                    id={lead.id}
                    tipo="site"
                    rotulo={pedido.siteStatus === "publicado" ? "Gerar o site de novo" : "Gerar site"}
                    rotuloPendente="Pedindo…"
                  />
                )}
              </dd>
            </>
          )}
          <dt>E-mail de aviso</dt>
          <dd>
            {lead.notificadaEm ? (
              `enviado em ${dataHora(lead.notificadaEm)}`
            ) : (
              <BotaoAcao id={lead.id} tipo="reenviar" rotulo="Enviar aviso por e-mail" rotuloPendente="Enviando…" />
            )}
          </dd>
        </dl>
      </section>
    </>
  );
}
