import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin";
import { usandoArquivoLocal } from "@/lib/db";
import {
  listarProspects,
  mensagemAbordagem,
  precisaAcompanhar,
  STATUS_PROSPECT,
  temperatura,
  TEMPERATURAS,
  type Prospect,
  type StatusProspect,
  type Temperatura,
} from "@/lib/prospeccao";
import { dataHora } from "../formato";
import { marcarProspect } from "./acoes";
import { FormBusca } from "./Busca";

export const metadata: Metadata = { title: "Prospecção" };

const ROTULO: Record<StatusProspect, string> = {
  novo: "Novo",
  contatado: "Contatado",
  interessado: "Interessado",
  descartado: "Descartado",
  cliente: "Virou cliente",
};

const ROTULO_TEMP: Record<Temperatura, string> = { quente: "Quente", morno: "Morno", frio: "Frio" };
const DICA_TEMP: Record<Temperatura, string> = {
  quente: "80 pontos ou mais",
  morno: "65 a 79 pontos",
  frio: "abaixo de 65 pontos",
};

/** Ordem do funil na aba Todos: primeiro quem pede ação, por último quem já saiu da fila. */
const GRUPOS: { status: StatusProspect; titulo: string; dica: string }[] = [
  { status: "interessado", titulo: "Interessados", dica: "Responderam. Feche a proposta." },
  { status: "contatado", titulo: "Contatados", dica: "Aguardando resposta. Os marcados com Acompanhar já podem receber a segunda mensagem." },
  { status: "novo", titulo: "Novos", dica: "Ainda não receberam mensagem. Os quentes primeiro." },
  { status: "cliente", titulo: "Viraram clientes", dica: "" },
  { status: "descartado", titulo: "Descartados", dica: "" },
];

type Busca = Promise<{ segmento?: string; local?: string; status?: string; temp?: string }>;

export default function Prospeccao({ searchParams }: { searchParams: Busca }) {
  return (
    <main className="adm-conteudo">
      <div className="adm-cabeca">
        <h1>Prospecção no Google</h1>
        <span className="prosp-atalho">
          <Link href="/admin/prospeccao/abordagem" className="adm-botao-fita adm-pequeno">
            Modo abordagem
          </Link>
          <Link href="/admin" className="rotulo">
            ← Contatos do site
          </Link>
        </span>
      </div>
      <Suspense fallback={<p className="rotulo">Carregando…</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function linkWhatsApp(p: Prospect) {
  const etapa = p.status === "contatado" && (p.tentativas ?? 0) >= 1 ? "acompanhamento" : "primeira";
  const d = (p.telefone ?? "").replace(/\D/g, "").replace(/^55/, "");
  return `https://wa.me/55${d}?text=${encodeURIComponent(mensagemAbordagem(p, etapa))}`;
}

async function Conteudo({ searchParams }: { searchParams: Busca }) {
  await exigirAdmin();
  if (usandoArquivoLocal()) return <p>Configure o Supabase para usar a prospecção.</p>;
  const sp = await searchParams;
  const status = (STATUS_PROSPECT as readonly string[]).includes(sp.status ?? "") ? (sp.status as StatusProspect) : undefined;
  const temp = (TEMPERATURAS as readonly string[]).includes(sp.temp ?? "") ? (sp.temp as Temperatura) : undefined;

  // Lê tudo do segmento e local uma vez; contagens e filtros saem da mesma lista.
  const base = await listarProspects({ segmento: sp.segmento, local: sp.local });
  const porTemp = temp ? base.filter((p) => temperatura(p.pontuacao) === temp) : base;
  const lista = status ? porTemp.filter((p) => p.status === status) : porTemp;

  const contaStatus = (s?: StatusProspect) => (s ? porTemp.filter((p) => p.status === s).length : porTemp.length);
  const ativos = base.filter((p) => p.status !== "descartado" && p.status !== "cliente");
  const contaTemp = (t?: Temperatura) => (t ? ativos.filter((p) => temperatura(p.pontuacao) === t).length : ativos.length);
  const acompanhar = base.filter((p) => precisaAcompanhar(p)).length;

  const url = (mudar: { status?: string | null; temp?: string | null }) => {
    const q = new URLSearchParams();
    if (sp.segmento) q.set("segmento", sp.segmento);
    if (sp.local) q.set("local", sp.local);
    const st = mudar.status === undefined ? status : mudar.status;
    const tp = mudar.temp === undefined ? temp : mudar.temp;
    if (st) q.set("status", st);
    if (tp) q.set("temp", tp);
    const s = q.toString();
    return s ? `/admin/prospeccao?${s}` : "/admin/prospeccao";
  };

  return (
    <>
      <FormBusca segmento={sp.segmento} local={sp.local} />

      <dl className="prosp-resumo">
        <div>
          <dt>Na fila</dt>
          <dd>{ativos.length}</dd>
        </div>
        <div className="r-quente">
          <dt>Quentes</dt>
          <dd>{contaTemp("quente")}</dd>
        </div>
        <div>
          <dt>Para abordar</dt>
          <dd>{base.filter((p) => p.status === "novo").length}</dd>
        </div>
        <div className={acompanhar ? "r-alerta" : undefined}>
          <dt>Acompanhar hoje</dt>
          <dd>{acompanhar}</dd>
        </div>
        <div className="r-interessado">
          <dt>Interessados</dt>
          <dd>{base.filter((p) => p.status === "interessado").length}</dd>
        </div>
      </dl>

      <div className="prosp-filtros">
        <nav className="adm-filtros" aria-label="Situação">
          <Link href={url({ status: null })} aria-current={!status ? "page" : undefined}>
            Todos <span className="prosp-conta">{contaStatus()}</span>
          </Link>
          {STATUS_PROSPECT.map((s) => (
            <Link key={s} href={url({ status: s })} aria-current={status === s ? "page" : undefined}>
              {ROTULO[s]} <span className="prosp-conta">{contaStatus(s)}</span>
            </Link>
          ))}
        </nav>
        <nav className="prosp-temps" aria-label="Categoria">
          <Link href={url({ temp: null })} aria-current={!temp ? "page" : undefined}>
            Todas as categorias
          </Link>
          {TEMPERATURAS.map((t) => (
            <Link key={t} href={url({ temp: t })} aria-current={temp === t ? "page" : undefined} className={`b-${t}`} title={DICA_TEMP[t]}>
              {ROTULO_TEMP[t]} <span className="prosp-conta">{contaTemp(t)}</span>
            </Link>
          ))}
        </nav>
      </div>

      {lista.length === 0 ? (
        <p className="adm-vazio">{base.length ? "Nenhum lead neste filtro." : "Nenhum lead ainda. Faça uma busca acima."}</p>
      ) : status ? (
        <Lista itens={lista} />
      ) : (
        GRUPOS.map((g) => {
          const itens = lista.filter((p) => p.status === g.status);
          if (!itens.length) return null;
          const cabeca = (
            <>
              <span className={`prosp-badge st-${g.status}`}>{g.titulo}</span>
              <span className="prosp-conta">{itens.length}</span>
              {g.dica && <span className="prosp-dica">{g.dica}</span>}
            </>
          );
          return g.status === "descartado" || g.status === "cliente" ? (
            <details key={g.status} className="prosp-grupo">
              <summary className="prosp-grupo-cabeca">{cabeca}</summary>
              <Lista itens={itens} />
            </details>
          ) : (
            <section key={g.status} className="prosp-grupo" aria-label={g.titulo}>
              <h2 className="prosp-grupo-cabeca">{cabeca}</h2>
              <Lista itens={g.status === "contatado" ? [...itens].sort((a, b) => Number(precisaAcompanhar(b)) - Number(precisaAcompanhar(a))) : itens} />
            </section>
          );
        })
      )}
    </>
  );
}

function Lista({ itens }: { itens: Prospect[] }) {
  return (
    <ul className="prosp-lista">
      {itens.map((p) => (
        <Item key={p.place_id} p={p} />
      ))}
    </ul>
  );
}

function Item({ p }: { p: Prospect }) {
  const t = temperatura(p.pontuacao);
  const acompanhar = precisaAcompanhar(p);
  const rede = p.motivos.includes("Usa rede social no lugar de site");
  const tentativas = p.tentativas ?? 0;
  return (
    <li className={`prosp-item st-${p.status}`}>
      <span className={`adm-nota t-${t}`}>
        {p.pontuacao}
        <small>pontos</small>
      </span>
      <div className="prosp-corpo">
        <span className="prosp-badges">
          <span className={`prosp-badge b-${t}`}>{ROTULO_TEMP[t]}</span>
          <span className={`prosp-badge st-${p.status}`}>{ROTULO[p.status]}</span>
          {acompanhar && <span className="prosp-badge b-alerta">Acompanhar</span>}
          {p.celular ? (
            <span className="prosp-badge b-zap">WhatsApp</span>
          ) : (
            p.telefone && <span className="prosp-badge">Telefone fixo</span>
          )}
          {p.instagram && <span className="prosp-badge b-insta">Instagram</span>}
          <span className="prosp-badge b-sem-site">{rede ? "Só rede social" : "Sem site"}</span>
          {tentativas > 0 && (
            <span className="prosp-badge" title={p.contatado_em ? `Última em ${dataHora(p.contatado_em)}` : undefined}>
              {tentativas} {tentativas === 1 ? "mensagem" : "mensagens"}
            </span>
          )}
          {p.pulado_em && p.status === "novo" && <span className="prosp-badge b-apagado">Pulado</span>}
        </span>
        <strong>{p.nome}</strong>
        <span className="rotulo">
          {p.segmento} · {p.local}
          {p.nota_google ? ` · ★ ${p.nota_google} (${p.avaliacoes ?? 0})` : " · sem avaliações"}
          {p.ultima_atividade ? ` · última avaliação ${dataHora(p.ultima_atividade)}` : ""}
        </span>
        {p.endereco && <span className="adm-apagado">{p.endereco}</span>}
        <span className="prosp-motivos">
          {p.motivos.map((m) => (
            <em key={m}>{m}</em>
          ))}
        </span>
        <span className="prosp-links">
          {p.telefone && p.celular && (
            <a className="adm-botao-zap adm-pequeno" href={linkWhatsApp(p)} target="_blank" rel="noopener noreferrer">
              WhatsApp {p.telefone}
            </a>
          )}
          {p.telefone && !p.celular && <a href={`tel:${p.telefone.replace(/\D/g, "")}`}>Ligar {p.telefone}</a>}
          {p.instagram && (
            <a href={p.instagram} target="_blank" rel="noopener noreferrer">
              Instagram
            </a>
          )}
          {p.site && !p.instagram && (
            <a href={p.site} target="_blank" rel="noopener noreferrer">
              Link do perfil
            </a>
          )}
          {p.maps_url && (
            <a href={p.maps_url} target="_blank" rel="noopener noreferrer">
              Google Maps
            </a>
          )}
          {!p.instagram && (
            <a
              href={`https://www.google.com/search?q=${encodeURIComponent(`${p.nome} ${p.local} instagram`)}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              Procurar Instagram
            </a>
          )}
        </span>
      </div>
      <form action={marcarProspect} className="prosp-status">
        <input type="hidden" name="id" value={p.place_id} />
        <select name="status" defaultValue={p.status} aria-label="Situação do lead">
          {STATUS_PROSPECT.map((s) => (
            <option key={s} value={s}>
              {ROTULO[s]}
            </option>
          ))}
        </select>
        <button type="submit" className="adm-pequeno">
          Salvar
        </button>
      </form>
    </li>
  );
}
