import { marca } from "@/content/site";

/** Link do WhatsApp do estúdio, com mensagem já escrita. Null enquanto marca.whatsapp não tiver um número válido. */
export function whatsappDoEstudio(mensagem?: string) {
  const n = marca.whatsapp.replace(/\D/g, "");
  if (n.length < 10) return null;
  const comPais = n.length <= 11 ? `55${n}` : n;
  return `https://wa.me/${comPais}${mensagem ? `?text=${encodeURIComponent(mensagem)}` : ""}`;
}
