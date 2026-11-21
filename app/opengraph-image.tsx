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
          background: "#ffffff",
          color: "#141414",
          borderBottom: "18px solid #D4006F",
        }}
      >
        <div style={{ display: "flex" }}>
          <div
            style={{
              color: "#141414",
              fontSize: 48,
              fontWeight: 900,
              letterSpacing: 4,
              textTransform: "uppercase",
              borderLeft: "16px solid #00A3E0",
              paddingLeft: 20,
            }}
          >
            {marca.nome}
          </div>
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 20 }}>
          <div style={{ fontSize: 64, fontWeight: 900, lineHeight: 1.05, textTransform: "uppercase", maxWidth: 980 }}>
            {seo.chamadaImagem}
          </div>
          <div style={{ fontSize: 30, color: "#5E5E5E" }}>{seo.apoioImagem}</div>
        </div>
      </div>
    ),
    size,
  );
}
