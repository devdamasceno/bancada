import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  cacheComponents: true,
  experimental: {
    serverActions: {
      // Codespaces: o navegador abre em localhost:3000, mas o túnel informa o host *.app.github.dev,
      // e o Next bloqueia a ação (login do /admin) como CSRF. Liberado só em desenvolvimento.
      allowedOrigins: process.env.NODE_ENV === "production" ? [] : ["localhost:3000"],
    },
  },
  partialPrefetching: true,
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
  // Landing pages geradas: qualquer endereço que não seja o site da Kriai (ex.: barbeariaesquina.kriai.online,
  // ou o domínio próprio do cliente) mostra o site salvo no banco. Previews da Vercel e localhost ficam de fora.
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: "/:caminho*",
          missing: [
            { type: "host", value: "www.kriai.online" },
            { type: "host", value: "kriai.online" },
            { type: "host", value: "(?<preview>.*)\\.vercel\\.app" },
            { type: "host", value: "localhost" },
            { type: "host", value: "127.0.0.1" },
          ],
          destination: "/api/s",
        },
      ],
    };
  },
  // Endereços da Vercel (estudiokriai.vercel.app e previews) não entram no Google: só www.kriai.online.
  async headers() {
    return [
      {
        source: "/:caminho*",
        has: [{ type: "host", value: "(?<vercel>.*)\\.vercel\\.app" }],
        headers: [{ key: "X-Robots-Tag", value: "noindex, nofollow" }],
      },
    ];
  },
  // Endereço oficial com www: quem digitar kriai.online (sem www) vai para www.kriai.online, mantendo o caminho.
  async redirects() {
    return [
      {
        source: "/:caminho*",
        has: [{ type: "host", value: "kriai.online" }],
        destination: "https://www.kriai.online/:caminho*",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
