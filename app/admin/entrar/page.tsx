import type { Metadata } from "next";
import { FormEntrar } from "../componentes";

export const metadata: Metadata = { title: "Entrar" };

export default function Entrar() {
  return (
    <main className="adm-entrar">
      <h1>Entrar no painel</h1>
      <FormEntrar />
    </main>
  );
}
