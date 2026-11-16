import { servicos } from "@/content/site";

function normalizar(texto: string) {
  return texto
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "");
}

const NEGOCIOS = [
  "barbearia", "salao", "restaurante", "pizzaria", "hamburgueria", "lanchonete", "padaria", "confeitaria", "doceria",
  "cafeteria", "bar", "academia", "studio", "estudio", "clinica", "consultorio", "dentista", "odontologia", "estetica",
  "pet shop", "petshop", "veterinaria", "loja", "mercado", "farmacia", "oficina", "escola", "curso", "imobiliaria",
  "advocacia", "escritorio", "contabilidade", "hotel", "pousada", "igreja", "manicure", "tatuagem", "otica",
];

/**
 * Leitura rápida no navegador, enquanto o cliente digita (antes de enviar): mostra as etiquetas "Já entendi".
 * Não chama a IA, não custa nada. Quem entende de verdade é o Claude, depois do envio.
 */
export function entenderRascunho(texto: string): string[] {
  const alvo = ` ${normalizar(texto).replace(/[^a-z0-9-]+/g, " ")} `;
  const tags: string[] = [];
  const negocio = NEGOCIOS.find((n) => alvo.includes(` ${n} `));
  if (negocio) tags.push(negocio === "salao" ? "salão" : negocio === "clinica" ? "clínica" : negocio);
  const cidade = texto.match(/\b(?:em|de) ([A-ZÀ-Ú][a-zà-ú]+(?: (?:d[aeo]s? )?[A-ZÀ-Ú][a-zà-ú]+)*)/);
  if (cidade && !/^(Reels|Instagram|Google|WhatsApp|TikTok|YouTube)$/.test(cidade[1])) tags.push(cidade[1]);
  for (const s of servicos) {
    if (s.gatilhos.some((g) => alvo.includes(` ${normalizar(g)}`))) tags.push(s.nome);
  }
  if (alvo.includes(" agenda")) tags.push("agendamento online");
  return [...new Set(tags)];
}
