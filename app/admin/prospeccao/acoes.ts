"use server";

import { revalidatePath } from "next/cache";
import { exigirAdmin } from "@/lib/admin";
import { mudarStatusProspect, prospectar, pularProspect, registrarEnvio, STATUS_PROSPECT, type StatusProspect } from "@/lib/prospeccao";

export type EstadoBusca = { ok?: string; erro?: string; segmento?: string; local?: string };

export async function buscarLeads(_: EstadoBusca, dados: FormData): Promise<EstadoBusca> {
  await exigirAdmin();
  const segmento = String(dados.get("segmento") ?? "").trim();
  const local = String(dados.get("local") ?? "").trim();
  if (!segmento || !local) return { erro: "Preencha o segmento e o local.", segmento, local };
  try {
    const r = await prospectar(segmento, local, 10);
    revalidatePath("/admin/prospeccao");
    if (!r.novos) {
      return {
        segmento,
        local,
        erro: r.aproveitados
          ? `Li ${r.lidos} empresas. As ${r.aproveitados} que se encaixam (sem site e com telefone) já estão na sua lista. Tente um bairro, cidade vizinha ou outro termo.`
          : `Li ${r.lidos} empresas e nenhuma se encaixa (todas têm site ou estão sem telefone). Tente outro segmento ou local.`,
      };
    }
    return {
      segmento,
      local,
      ok: `${r.novos} leads novos salvos. Li ${r.lidos} empresas, ${r.aproveitados} sem site e com telefone${r.jaSalvos ? `, ${r.jaSalvos} já estavam na lista` : ""}.`,
    };
  } catch (err) {
    return { segmento, local, erro: err instanceof Error ? err.message : "Não consegui buscar agora." };
  }
}

export async function marcarProspect(dados: FormData) {
  await exigirAdmin();
  const id = String(dados.get("id") ?? "");
  const status = String(dados.get("status") ?? "") as StatusProspect;
  if (!id || !(STATUS_PROSPECT as readonly string[]).includes(status)) return;
  await mudarStatusProspect(id, status);
  revalidatePath("/admin/prospeccao");
}

export async function enviadoNaAbordagem(id: string) {
  await exigirAdmin();
  await registrarEnvio(id);
}

export async function pularNaAbordagem(id: string) {
  await exigirAdmin();
  await pularProspect(id);
}

export async function statusNaAbordagem(id: string, status: StatusProspect) {
  await exigirAdmin();
  if (!(STATUS_PROSPECT as readonly string[]).includes(status)) return;
  await mudarStatusProspect(id, status);
}
