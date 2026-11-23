import { Suspense } from "react";
import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";
import { listarLeads, usandoArquivoLocal, type LeadResumo } from "@/lib/db";
import { BotaoSair } from "./componentes";
import { dataHora, reais, ROTULO_SITUACAO, ROTULO_TEMPERATURA } from "./formato";

const FILTROS = {
  todos: { rotulo: "Todos", filtro: () => true },
  enviados: { rotulo: "Pedidos enviados", filtro: (l: LeadResumo) => l.situacao === "enviado" },
  quentes: { rotulo: "Quentes", filtro: (l: LeadResumo) => l.temperatura === "quente" },
  // abandonou, mas deixou como falar com a pessoa: vale uma mensagem
  recuperar: {
    rotulo: "Abandonou com contato",
    filtro: (l: LeadResumo) => l.situacao === "abandonado" && !!(l.whatsapp || l.email),
  },
  conversando: { rotulo: "Conversando agora", filtro: (l: LeadResumo) => l.situacao === "conversando" },
} as const;
type Filtro = keyof typeof FILTROS;

export default function Painel({ searchParams }: PageProps<"/admin">) {
  return (
    <main className="adm-conteudo">
      <Suspense fallback={<p className="rotulo">Carregando contatos…</p>}>
        <Lista searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Lista({ searchParams }: { searchParams: PageProps<"/admin">["searchParams"] }) {
  await exigirAdmin();
  if (usandoArquivoLocal()) return <p>Configure o Supabase no .env.local para ver os contatos.</p>;

  const sp = await searchParams;
  const ver: Filtro = typeof sp.ver === "string" && sp.ver in FILTROS ? (sp.ver as Filtro) : "todos";
  const porNota = sp.ordem === "nota";

  const todos = await listarLeads();
  const contagem = (f: Filtro) => todos.filter(FILTROS[f].filtro).length;
  let lista = todos.filter(FILTROS[ver].filtro);
  if (porNota) lista = [...lista].sort((a, b) => (b.nota ?? -1) - (a.nota ?? -1));

  const link = (mudar: { ver?: Filtro; ordem?: string }) => {
    const p = new URLSearchParams();
    const v = mudar.ver ?? ver;
    const o = mudar.ordem ?? (porNota ? "nota" : "");
    if (v !== "todos") p.set("ver", v);
    if (o) p.set("ordem", o);
    const q = p.toString();
    return q ? `/admin?${q}` : "/admin";
  };

  return (
    <>
      <div className="adm-cabeca">
        <h1>Contatos</h1>
        <span className="prosp-atalho">
          <Link href="/admin/prospeccao" className="adm-botao-fita adm-pequeno">
            Prospectar no Google
          </Link>
          <BotaoSair />
        </span>
      </div>

      <nav className="adm-filtros" aria-label="Filtrar contatos">
        {(Object.keys(FILTROS) as Filtro[]).map((f) => (
          <Link key={f} href={link({ ver: f })} aria-current={f === ver ? "page" : undefined}>
            {FILTROS[f].rotulo} <span className="adm-num">{contagem(f)}</span>
          </Link>
        ))}
      </nav>
      <p className="adm-ordem rotulo">
        Ordenar:{" "}
        <Link href={link({ ordem: "" })} aria-current={!porNota ? "page" : undefined}>
          mais recentes
        </Link>{" "}
        ·{" "}
        <Link href={link({ ordem: "nota" })} aria-current={porNota ? "page" : undefined}>
          maior nota
        </Link>
      </p>

      {lista.length === 0 ? (
        <p className="adm-vazio">Nenhum contato aqui ainda.</p>
      ) : (
        <ul className="adm-lista">
          {lista.map((l) => (
            <li key={l.id}>
              <Link href={`/admin/${l.id}`} className="adm-item">
                <span className={`adm-nota ${l.temperatura ? `t-${l.temperatura}` : "t-nada"}`}>
                  {l.nota ?? "–"}
                  <small>{l.temperatura ? ROTULO_TEMPERATURA[l.temperatura] : "sem nota"}</small>
                </span>
                <span className="adm-quem">
                  <strong>{l.nome || "Sem nome"}</strong>
                  <span>{[l.negocio, l.cidade].filter(Boolean).join(" · ") || "Negócio não informado"}</span>
                  {l.resumo && <span className="adm-resumo">{l.resumo}</span>}
                </span>
                <span className="adm-meta">
                  <span className={`adm-situacao s-${l.situacao}`}>{ROTULO_SITUACAO[l.situacao]}</span>
                  <span>{reais(l.valorMinimo)}</span>
                  <span className="rotulo">{dataHora(l.atualizadaEm)}</span>
                </span>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </>
  );
}
