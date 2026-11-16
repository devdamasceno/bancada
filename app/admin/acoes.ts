"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { refresh } from "next/cache";
import { abrirSessao, bloqueado, exigirAdmin, fecharSessao, registrarErro, senhaConfere } from "@/lib/admin";
import { obterLead } from "@/lib/db";
import { avaliarESalvar, enviarConfirmacaoCliente, notificarLead, type ResultadoCliente } from "@/lib/notificacao";

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export type EstadoEntrar = { erro?: string };

export async function entrar(_: EstadoEntrar, dados: FormData): Promise<EstadoEntrar> {
  const h = await headers();
  const ip = h.get("x-forwarded-for")?.split(",")[0]?.trim() || "local";
  if (bloqueado(ip)) return { erro: "Muitas tentativas. Espere 15 minutos." };
  const senha = String(dados.get("senha") ?? "");
  if (!senhaConfere(senha)) {
    registrarErro(ip);
    await new Promise((r) => setTimeout(r, 800)); // atrasa quem tenta adivinhar
    return { erro: "Senha incorreta." };
  }
  await abrirSessao();
  redirect("/admin");
}

export async function sair() {
  await fecharSessao();
  redirect("/admin/entrar");
}

export type EstadoAcao = { ok?: string; erro?: string };

export async function reavaliar(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  await exigirAdmin();
  const id = String(dados.get("id") ?? "");
  if (!UUID.test(id)) return { erro: "Contato inválido." };
  const lead = await obterLead(id);
  if (!lead) return { erro: "Contato não encontrado." };
  const av = await avaliarESalvar(lead);
  refresh();
  return av ? { ok: "Avaliação atualizada." } : { erro: "A IA não conseguiu avaliar agora. Tente de novo." };
}

export async function reenviarEmail(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  await exigirAdmin();
  const id = String(dados.get("id") ?? "");
  if (!UUID.test(id)) return { erro: "Contato inválido." };
  const lead = await obterLead(id);
  if (!lead) return { erro: "Contato não encontrado." };
  if (lead.notificadaEm) return { erro: "O e-mail deste contato já foi enviado." };
  const h = await headers();
  const base =
    process.env.SITE_URL?.replace(/\/$/, "") || `${h.get("x-forwarded-proto") ?? "http"}://${h.get("host") ?? "localhost:3000"}`;
  const ok = await notificarLead(lead, lead.avaliacao, base);
  refresh();
  return ok ? { ok: "E-mail enviado." } : { erro: "Não foi possível enviar. Confira RESEND_API_KEY e NOTIFICAR_EMAIL." };
}

const MENSAGEM_CLIENTE: Record<ResultadoCliente, EstadoAcao> = {
  enviado: { ok: "Confirmação enviada ao cliente." },
  sem_email: { erro: "O cliente não informou um e-mail válido." },
  nao_enviado_ainda: { erro: "Só dá para confirmar depois que o cliente enviar o pedido." },
  desligado: { erro: "Configure EMAIL_REMETENTE com um domínio verificado no Resend." },
  ja_enviado: { erro: "A confirmação já foi enviada." },
  falhou: { erro: "O Resend recusou o envio. Veja o log do servidor." },
};

export async function emailCliente(_: EstadoAcao, dados: FormData): Promise<EstadoAcao> {
  await exigirAdmin();
  const id = String(dados.get("id") ?? "");
  if (!UUID.test(id)) return { erro: "Contato inválido." };
  const lead = await obterLead(id);
  if (!lead) return { erro: "Contato não encontrado." };
  const r = await enviarConfirmacaoCliente(lead);
  refresh();
  return MENSAGEM_CLIENTE[r];
}
