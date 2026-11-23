import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin";
import { usandoArquivoLocal } from "@/lib/db";
import { listarProspects, mensagemAbordagem, type Prospect } from "@/lib/prospeccao";
import { FormBusca } from "./Busca";
import { ListaLeads, type LeadTela } from "./Lista";

export const metadata: Metadata = { title: "Prospecção" };

type Busca = Promise<{ segmento?: string; local?: string; status?: string }>;

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

function zap(p: Prospect, etapa: "primeira" | "acompanhamento") {
  const d = (p.telefone ?? "").replace(/\D/g, "").replace(/^55/, "");
  if (!p.celular || d.length < 10) return null;
  return `https://wa.me/55${d}?text=${encodeURIComponent(mensagemAbordagem(p, etapa))}`;
}

function paraTela(p: Prospect & { tentativas?: number | null; contatado_em?: string | null }): LeadTela {
  return {
    id: p.place_id,
    nome: p.nome,
    segmento: p.segmento,
    local: p.local,
    endereco: p.endereco,
    telefone: p.telefone,
    celular: p.celular,
    instagram: p.instagram,
    site: p.site,
    maps: p.maps_url,
    nota: p.nota_google,
    avaliacoes: p.avaliacoes,
    ultimaAvaliacao: p.ultima_atividade,
    pontuacao: p.pontuacao,
    motivos: p.motivos ?? [],
    status: p.status,
    tentativas: p.tentativas ?? 0,
    contatadoEm: p.contatado_em ?? null,
    criadoEm: p.criado_em,
    zapPrimeira: zap(p, "primeira"),
    zapRetorno: zap(p, "acompanhamento"),
  };
}

async function Conteudo({ searchParams }: { searchParams: Busca }) {
  await exigirAdmin();
  if (usandoArquivoLocal()) return <p>Configure o Supabase para usar a prospecção.</p>;
  const sp = await searchParams;
  // a lista vem inteira e os filtros rodam no navegador, sem recarregar a página
  const lista = (await listarProspects({})).map(paraTela);
  return (
    <>
      <FormBusca segmento={sp.segmento} local={sp.local} />
      <ListaLeads key={`${sp.segmento ?? ""}|${sp.local ?? ""}|${lista.length}`} leads={lista} segmentoInicial={sp.segmento} localInicial={sp.local} />
    </>
  );
}
