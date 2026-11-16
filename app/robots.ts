import type { MetadataRoute } from "next";
import { marca } from "@/content/site";

// /robots.txt: libera o site para o Google e esconde o painel e a API.
export default function robots(): MetadataRoute.Robots {
  return {
    rules: { userAgent: "*", allow: "/", disallow: ["/admin", "/api/"] },
    sitemap: `https://${marca.dominio}/sitemap.xml`,
    host: `https://${marca.dominio}`,
  };
}
