import type { Metadata } from "next";
import { Atendimento } from "@/components/Atendimento";
import { Fundo } from "@/components/Fundo";

export const metadata: Metadata = {
  title: "Conversar com a Kria",
  description:
    "Orçamento de site, vídeo, logo e Google na hora: conte o que você vende e em 2 minutos a Kria, assistente de IA, monta o plano e mostra quanto custa.",
  alternates: { canonical: "/conversa" },
};

// O chat. Os botões da página inicial trazem para cá; anúncios também podem apontar direto para /conversa.
export default function Conversa() {
  return (
    <>
      <Fundo />
      <Atendimento />
    </>
  );
}
