import type { Metadata } from "next";
import { Atendimento } from "@/components/Atendimento";
import { Fundo } from "@/components/Fundo";

export const metadata: Metadata = {
  title: "Conversar com a Kria",
  description: "Conte o que você vende. Em 2 minutos a Kria monta o plano e mostra quanto custa.",
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
