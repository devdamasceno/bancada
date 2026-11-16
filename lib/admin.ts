import "server-only";
import { createHash, createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { connection } from "next/server";

// Acesso à área administrativa: uma senha só (ADMIN_SENHA no .env.local) e um cookie assinado.
// Trocar a senha derruba todas as sessões abertas.

const COOKIE = "kriai_admin";
const DURACAO_S = 7 * 24 * 60 * 60; // 7 dias

function chave() {
  const senha = process.env.ADMIN_SENHA;
  if (!senha || senha.length < 10) return null; // senha curta demais = área fechada
  return createHash("sha256").update(`kriai-admin:${senha}`).digest();
}

const assinar = (k: Buffer, expira: number) => createHmac("sha256", k).update(String(expira)).digest("hex");

function iguais(a: string, b: string) {
  const x = createHash("sha256").update(a).digest();
  const y = createHash("sha256").update(b).digest();
  return timingSafeEqual(x, y);
}

export const adminConfigurado = () => chave() !== null;

export function senhaConfere(tentativa: string) {
  const senha = process.env.ADMIN_SENHA;
  return !!senha && chave() !== null && iguais(tentativa, senha);
}

export async function abrirSessao() {
  const k = chave();
  if (!k) throw new Error("ADMIN_SENHA não configurada");
  const expira = Math.floor(Date.now() / 1000) + DURACAO_S;
  (await cookies()).set(COOKIE, `${expira}.${assinar(k, expira)}`, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/admin",
    maxAge: DURACAO_S,
  });
}

export async function fecharSessao() {
  (await cookies()).delete({ name: COOKIE, path: "/admin" });
}

export async function sessaoValida() {
  // Cache Components: tudo daqui em diante (validade da sessão, horários do painel) é da requisição,
  // nunca do pré-render. Sem isto, o Date.now() abaixo quebra a página.
  await connection();
  const k = chave();
  const valor = (await cookies()).get(COOKIE)?.value;
  if (!k || !valor) return false;
  const [exp, assinatura] = valor.split(".");
  const expira = Number(exp);
  if (!Number.isFinite(expira) || expira < Date.now() / 1000 || !assinatura) return false;
  return iguais(assinatura, assinar(k, expira));
}

/** Use no começo de toda página e ação da área administrativa. */
export async function exigirAdmin() {
  if (!(await sessaoValida())) redirect("/admin/entrar");
}

/* Limite de tentativas de senha por IP (memória do servidor): 5 erros em 15 minutos bloqueiam. */
const erros = new Map<string, number[]>();
const JANELA = 15 * 60_000;

export function bloqueado(ip: string) {
  const agora = Date.now();
  const recentes = (erros.get(ip) ?? []).filter((t) => agora - t < JANELA);
  erros.set(ip, recentes);
  return recentes.length >= 5;
}

export function registrarErro(ip: string) {
  if (erros.size > 5000) erros.clear();
  erros.set(ip, [...(erros.get(ip) ?? []), Date.now()]);
}
