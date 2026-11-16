import { formatarReais } from "@/content/site";
import type { Avaliacao, Situacao } from "@/lib/db";

const FUSO = "America/Sao_Paulo";

export const dataHora = (iso: string | null) =>
  iso
    ? new Date(iso).toLocaleString("pt-BR", { timeZone: FUSO, day: "2-digit", month: "2-digit", hour: "2-digit", minute: "2-digit" })
    : "—";

export const reais = (v: number | null) => (v ? formatarReais(v) : "—");

export const ROTULO_SITUACAO: Record<Situacao, string> = {
  enviado: "Pedido enviado",
  abandonado: "Abandonou",
  conversando: "Conversando",
};

export const ROTULO_TEMPERATURA: Record<Avaliacao["temperatura"], string> = {
  quente: "Quente",
  morno: "Morno",
  frio: "Frio",
};
