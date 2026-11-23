import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin";
import { usandoArquivoLocal } from "@/lib/db";
import { listarProspects, STATUS_PROSPECT, type Prospect } from "@/lib/prospeccao";
import { marca } from "@/content/site";
import { dataHora } from "../formato";
import { marcarProspect } from "./acoes";
import { FormBusca } from "./Busca";

export const metadata: Metadata = { title: "Prospecção" };

const ROTULO: Record<(typeof STATUS_PROSPECT)[number], string> = {
  novo: "Novo",
  contatado: "Contatado",
  interessado: "Interessado",
  descartado: "Descartado",
  cliente: "Virou cliente",
};

type Busca = Promise<{ segmento?: string; local?: string; status?: string }>;

export default function Prospeccao({ searchParams }: { searchParams: Busca }) {
  return (
    <main className="adm-conteudo">
      <div className="adm-cabeca">
        <h1>Prospecção no Google</h1>
        <Link href="/admin" className="rotulo">
          ← Contatos do site
        </Link>
      </div>
      <Suspense fallback={<p className="rotulo">Carregando…</p>}>
        <Conteudo searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

function mensagem(p: Prospect) {
  const texto = `Olá, tudo bem? Vi o perfil da ${p.nome} no Google e reparei que vocês ainda não têm um site. Sou da ${marca.nome}: fazemos landing pages para ${p.segmento} a partir de R$ 397, prontas no mesmo dia, com botão direto para o WhatsApp de vocês. Posso te mostrar um exemplo?`;
  const d = (p.telefone ?? "").replace(/\D/g, "").replace(/^55/, "");
  return `https://wa.me/55${d}?text=${encodeURIComponent(texto)}`;
}

async function Conteudo({ searchParams }: { searchParams: Busca }) {
  await exigirAdmin();
  if (usandoArquivoLocal()) return <p>Configure o Supabase para usar a prospecção.</p>;
  const sp = await searchParams;
  const lista = await listarProspects({ segmento: sp.segmento, local: sp.local, status: sp.status });
  const filtro = (status?: string) => {
    const q = new URLSearchParams();
    if (sp.segmento) q.set("segmento", sp.segmento);
    if (sp.local) q.set("local", sp.local);
    if (status) q.set("status", status);
    const s = q.toString();
    return s ? `/admin/prospeccao?${s}` : "/admin/prospeccao";
  };

  return (
    <>
      <FormBusca segmento={sp.segmento} local={sp.local} />

      <form className="prosp-filtro" action="/admin/prospeccao">
        <input name="segmento" defaultValue={sp.segmento ?? ""} placeholder="Filtrar segmento" />
        <input name="local" defaultValue={sp.local ?? ""} placeholder="Filtrar local" />
        {sp.status && <input type="hidden" name="status" value={sp.status} />}
        <button type="submit" className="adm-pequeno">
          Filtrar
        </button>
      </form>
      <nav className="adm-filtros" aria-label="Situação">
        <Link href={filtro()} aria-current={!sp.status ? "page" : undefined}>
          Todos
        </Link>
        {STATUS_PROSPECT.map((s) => (
          <Link key={s} href={filtro(s)} aria-current={sp.status === s ? "page" : undefined}>
            {ROTULO[s]}
          </Link>
        ))}
      </nav>

      {lista.length === 0 ? (
        <p className="adm-vazio">Nenhum lead ainda. Faça uma busca acima.</p>
      ) : (
        <ul className="prosp-lista">
          {lista.map((p) => (
            <li key={p.place_id} className={`prosp-item st-${p.status}`}>
              <span className="adm-nota t-quente">
                {p.pontuacao}
                <small>pontos</small>
              </span>
              <div className="prosp-corpo">
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
                    <a className="adm-botao-zap adm-pequeno" href={mensagem(p)} target="_blank" rel="noopener noreferrer">
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
                  <a
                    href={`https://www.google.com/search?q=${encodeURIComponent(`${p.nome} ${p.local} instagram`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    Procurar Instagram
                  </a>
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
          ))}
        </ul>
      )}
    </>
  );
}
