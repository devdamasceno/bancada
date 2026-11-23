"use client";

import { useActionState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { buscarLeads, type EstadoBusca } from "./acoes";

export function FormBusca({ segmento, local }: { segmento?: string; local?: string }) {
  const [estado, acao, pendente] = useActionState<EstadoBusca, FormData>(buscarLeads, { segmento, local });
  const router = useRouter();
  // depois da busca, a lista abaixo passa a mostrar só esse segmento e local
  useEffect(() => {
    if (!estado.segmento || !estado.local || (estado.segmento === segmento && estado.local === local)) return;
    const q = new URLSearchParams({ segmento: estado.segmento, local: estado.local });
    router.replace(`/admin/prospeccao?${q}`, { scroll: false });
  }, [estado, segmento, local, router]);
  return (
    <form action={acao} className="adm-cartao prosp-busca">
      <div className="prosp-campos">
        <label>
          Segmento
          <input name="segmento" required defaultValue={estado.segmento ?? ""} placeholder="ex.: barbearia, confeitaria, clínica de estética" list="prosp-segmentos" />
        </label>
        <label>
          Local
          <input name="local" required defaultValue={estado.local ?? ""} placeholder="ex.: Juiz de Fora, MG ou bairro São Mateus, Juiz de Fora" />
        </label>
        <button type="submit" className="adm-botao-fita" disabled={pendente}>
          {pendente ? "Buscando…" : "Buscar 10 leads"}
        </button>
      </div>
      <datalist id="prosp-segmentos">
        {["barbearia", "salão de beleza", "confeitaria", "restaurante", "delivery", "clínica", "consultório odontológico", "fisioterapia", "oficina mecânica", "pet shop", "loja de roupas", "personal trainer"].map((s) => (
          <option key={s} value={s} />
        ))}
      </datalist>
      <ul className="prosp-regras">
        <li>
          <b>Obrigatório:</b> sem site próprio e com telefone
        </li>
        <li>
          <b>Pontuam mais:</b> celular (WhatsApp), Instagram no perfil, avaliações recentes e perfis novos
        </li>
      </ul>
      {(segmento || local) && (
        <p className="prosp-dica">
          Mostrando os leads salvos de {[segmento, local].filter(Boolean).join(" em ")}. <Link href="/admin/prospeccao">Ver todos</Link>
        </p>
      )}
      {pendente && <p className="prosp-dica">Lendo até 60 empresas no Google… leva uns 10 segundos.</p>}
      {estado.ok && <p className="adm-ok">{estado.ok}</p>}
      {estado.erro && <p className="adm-erro">{estado.erro}</p>}
    </form>
  );
}
