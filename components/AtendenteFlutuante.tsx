"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { IconeIA } from "@/components/Marca";

/** Atendente de IA flutuante no canto inferior direito. Leva para a conversa; some na própria conversa e no painel. */
export function AtendenteFlutuante() {
  const rota = usePathname();
  if (rota.startsWith("/conversa") || rota.startsWith("/admin")) return null;
  return (
    <Link href="/conversa" className="atendente-flutuante" aria-label="Conversar com a Kria, assistente de IA">
      <span className="atendente-icone">
        <IconeIA tamanho={24} />
      </span>
      <span className="atendente-texto" aria-hidden="true">
        <b>Fale com a Kria</b>
        <span>Preço em 2 minutos</span>
      </span>
    </Link>
  );
}
