import type { Metadata } from "next";
import { Campanhas, Fechamento } from "@/components/Campanhas";
import { Topo } from "@/components/Marca";
import { Modelos } from "@/components/Modelos";
import { Rodape } from "@/components/Rodape";

export const metadata: Metadata = {
  title: "Campanhas",
  description:
    "Landing pages e campanhas que a Kriai criou para pequenos negócios, e modelos de site por segmento.",
  alternates: { canonical: "/portfolio" },
  openGraph: {
    title: "Campanhas",
    description: "Landing pages e campanhas que a Kriai criou para pequenos negócios, e modelos de site por segmento.",
    url: "/portfolio",
    siteName: "Kriai",
    locale: "pt_BR",
    type: "website",
  },
};

export default function Portfolio() {
  return (
    <>
      <Topo />
      <main id="conteudo">
        <Campanhas comoPagina />
        <Modelos />
        <Fechamento />
      </main>
      <Rodape />
    </>
  );
}
