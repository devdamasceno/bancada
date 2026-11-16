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
};

export default nextConfig;
