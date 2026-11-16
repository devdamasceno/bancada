import type { MetadataRoute } from "next";
import { marca } from "@/content/site";

// /sitemap.xml: as páginas públicas que o Google deve indexar. Página nova pública? Acrescente aqui.
export default function sitemap(): MetadataRoute.Sitemap {
  const base = `https://${marca.dominio}`;
  return [
    { url: `${base}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${base}/conversa`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${base}/privacidade`, changeFrequency: "yearly", priority: 0.2 },
  ];
}
