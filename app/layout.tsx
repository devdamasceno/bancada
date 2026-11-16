import type { Metadata } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { marca } from "@/content/site";
import { Consentimento } from "@/components/Consentimento";
import "./globals.css";

const archivo = Archivo({ subsets: ["latin"], axes: ["wdth"], variable: "--font-archivo", display: "swap" });
const plexMono = IBM_Plex_Mono({ subsets: ["latin"], weight: ["400", "500"], variable: "--font-plex-mono", display: "swap" });

export const viewport = { themeColor: "#0c0f0e", colorScheme: "dark" as const };

export const metadata: Metadata = {
  metadataBase: new URL(`https://${marca.dominio}`),
  title: { default: `${marca.nome}: site profissional, você só paga depois de aprovar`, template: `%s | ${marca.nome}` },
  description: marca.descricao,
  openGraph: {
    title: `${marca.nome}: site profissional, você só paga depois de aprovar`,
    description: marca.descricao,
    locale: "pt_BR",
    type: "website",
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="pt-BR" className={`${archivo.variable} ${plexMono.variable}`} suppressHydrationWarning>
      <body>
        <a href="#conteudo" className="pular">
          Pular para o conteúdo
        </a>
        {children}
        <Consentimento />
      </body>
    </html>
  );
}
