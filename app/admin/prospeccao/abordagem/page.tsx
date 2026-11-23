import { Suspense } from "react";
import Link from "next/link";
import type { Metadata } from "next";
import { exigirAdmin } from "@/lib/admin";
import { filaAbordagem, mensagemAbordagem } from "@/lib/prospeccao";
import { Abordagem } from "./Abordagem";

export const metadata: Metadata = { title: "Modo abordagem" };

type Busca = Promise<{ segmento?: string; local?: string }>;

export default function Pagina({ searchParams }: { searchParams: Busca }) {
  return (
    <main className="adm-conteudo">
      <div className="adm-cabeca">
        <h1>Modo abordagem</h1>
        <Link href="/admin/prospeccao" className="rotulo">
          ← Prospecção
        </Link>
      </div>
      <Suspense fallback={<p className="rotulo">Montando a fila…</p>}>
        <Fila searchParams={searchParams} />
      </Suspense>
    </main>
  );
}

async function Fila({ searchParams }: { searchParams: Busca }) {
  await exigirAdmin();
  const sp = await searchParams;
  const { fila, enviadosHoje } = await filaAbordagem({ segmento: sp.segmento, local: sp.local });
  const itens = fila.map((p) => ({ ...p, mensagem: mensagemAbordagem(p, p.etapa) }));
  return <Abordagem itens={itens} enviadosHoje={enviadosHoje} filtro={[sp.segmento, sp.local].filter(Boolean).join(" em ")} />;
}
