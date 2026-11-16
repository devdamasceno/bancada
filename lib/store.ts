import "server-only";
import { appendFile, mkdir } from "node:fs/promises";
import path from "node:path";

// Armazenamento simples em arquivos NDJSON (uma linha JSON por registro).
// Serve para começar; em produção troque por um banco (Postgres, Supabase, planilha etc.).
const PASTA = path.join(process.cwd(), "data");

export async function anexar(arquivo: "leads" | "eventos", registro: object) {
  await mkdir(PASTA, { recursive: true });
  await appendFile(path.join(PASTA, `${arquivo}.ndjson`), JSON.stringify(registro) + "\n", "utf8");
}
