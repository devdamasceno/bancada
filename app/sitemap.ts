import type { MetadataRoute } from "next";
import { marca } from "@/content/site";

// /sitemap.xml: as páginas públicas que o Google deve indexar. Página nova pública? Acrescente aqui.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${marca.dominio}`;
  const hoje = new Date();
  return [
    { url: `${base}/`, lastModified: hoje, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/portfolio`, lastModified: hoje, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/conversa`, lastModified: hoje, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacidade`, lastModified: hoje, changeFrequency: "yearly", priority: 0.2 },
  ];
}
