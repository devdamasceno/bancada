import type { Metadata } from "next";
import { Suspense } from "react";
import { Archivo, IBM_Plex_Mono } from "next/font/google";
import { seo } from "@/content/seo";
import { marca } from "@/content/site";
import { AtendenteFlutuante } from "@/components/AtendenteFlutuante";
import { Consentimento } from "@/components/Consentimento";
import "./globals.css";

const archivo = Archivo({
  subsets: ["latin"],
  axes: ["wdth"],
  variable: "--font-archivo",
  display: "swap",
});
const plexMono = IBM_Plex_Mono({
  subsets: ["latin"],
  weight: ["400", "500"],
  variable: "--font-plex-mono",
  display: "swap",
});

export const viewport = { themeColor: "#0c0f0e", colorScheme: "dark" as const };

export const metadata: Metadata = {
  metadataBase: new URL(`https://${marca.dominio}`),
  title: { default: seo.titulo, template: `%s | ${marca.nome}` },
  description: seo.descricao,
  applicationName: marca.nome,
  alternates: { canonical: "/" },
  openGraph: {
    title: seo.titulo,
    description: seo.descricao,
    url: "/",
    siteName: marca.nome,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.titulo,
    description: seo.descricao,
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: { google: seo.googleVerificacao },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="pt-BR"
      className={`${archivo.variable} ${plexMono.variable}`}
      suppressHydrationWarning
    >
      <body>
        <a href="#conteudo" className="pular">
          Pular para o conteúdo
        </a>
        {children}
        {/* usePathname suspende em rotas com parâmetro dinâmico (cacheComponents); o Suspense mantém o resto pré-renderizado */}
        <Suspense fallback={null}>
          <AtendenteFlutuante />
        </Suspense>
        <Consentimento />
      </body>
    </html>
  );
}
