import type { Metadata } from "next";
import { Suspense } from "react";
import { Big_Shoulders, Figtree } from "next/font/google";
import { seo } from "@/content/seo";
import { marca } from "@/content/site";
import { AtendenteFlutuante } from "@/components/AtendenteFlutuante";
import { Consentimento } from "@/components/Consentimento";
import "./globals.css";

// Títulos em letra de cartaz (estreita e pesada); texto em sans-serif legível.
// Big Shoulders é fonte variável (peso e tamanho óptico): o navegador ajusta o desenho ao tamanho do título.
const titulo = Big_Shoulders({
  subsets: ["latin"],
  variable: "--font-titulo",
  display: "swap",
});
const texto = Figtree({
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  variable: "--font-texto",
  display: "swap",
});

export const viewport = { themeColor: "#ffffff", colorScheme: "light" as const };

export const metadata: Metadata = {
  metadataBase: new URL(`https://${marca.dominio}`),
  title: { default: seo.titulo, template: `%s | ${marca.nome}` },
  description: seo.descricao,
  applicationName: marca.nome,
  alternates: { canonical: "/" },
  openGraph: {
    title: seo.titulo,
    description: seo.descricaoCompartilhar,
    url: "/",
    siteName: marca.nome,
    locale: "pt_BR",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: seo.titulo,
    description: seo.descricaoCompartilhar,
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
      className={`${titulo.variable} ${texto.variable}`}
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
