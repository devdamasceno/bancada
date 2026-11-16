import { anexar } from "@/lib/store";

const PERMITIDOS = new Set([
  "pagina_vista",
  "intro_vista",
  "intro_pulada",
  "atendimento_iniciado",
  "pedido_enviado",
]);

export async function POST(request: Request) {
  try {
    const corpo = JSON.parse(await request.text());
    if (!PERMITIDOS.has(corpo.evento)) return new Response(null, { status: 204 });
    await anexar("eventos", {
      em: new Date().toISOString(),
      evento: corpo.evento,
      dados: corpo.dados ?? {},
      visitante: typeof corpo.visitante === "string" ? corpo.visitante.slice(0, 64) : null,
      pagina: typeof corpo.pagina === "string" ? corpo.pagina.slice(0, 200) : null,
      origem: typeof corpo.origem === "string" ? corpo.origem.slice(0, 500) : null,
      utm: corpo.utm ?? {},
    });
  } catch {
    // evento malformado: ignora sem quebrar a página
  }
  return new Response(null, { status: 204 });
}
