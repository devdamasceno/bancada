"use client";

import { useActionState } from "react";
import { buscarLeads, type EstadoBusca } from "./acoes";

export function FormBusca({ segmento, local }: { segmento?: string; local?: string }) {
  const [estado, acao, pendente] = useActionState<EstadoBusca, FormData>(buscarLeads, { segmento, local });
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
      <p className="rotulo">
        Sem site próprio e com telefone são obrigatórios. Pontuam mais: celular (WhatsApp), Instagram no perfil, avaliações recentes e perfis novos.
      </p>
      {pendente && <p className="rotulo">Lendo até 60 empresas no Google… leva uns 10 segundos.</p>}
      {estado.ok && <p className="adm-ok">{estado.ok}</p>}
      {estado.erro && <p className="adm-erro">{estado.erro}</p>}
    </form>
  );
}
