import { ImageResponse } from "next/og";
import { marca } from "@/content/site";
import { seo } from "@/content/seo";

// Imagem que aparece ao compartilhar o link no WhatsApp, Instagram, LinkedIn etc.
export const alt = seo.titulo;
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function Imagem() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: 72,
          background: "radial-gradient(ellipse at 30% 30%, #1f2a26, #0c0f0e 70%)",
          color: "#e8ebe5",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              background: "#e7c75c",
              color: "#14120a",
              padding: "10px 28px",
              fontSize: 44,
              fontWeight: 900,
              letterSpacing: 3,
              textTransform: "uppercase",
              transform: "rotate(-2deg)",
            }}
          >
            {marca.nome}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.05, textTransform: "uppercase", maxWidth: 980 }}>
            {seo.chamadaImagem}
          </div>
          <div style={{ fontSize: 30, color: "#9aa39e" }}>{seo.apoioImagem}</div>
        </div>
      </div>
    ),
    size,
  );
}
