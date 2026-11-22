import "server-only";
import { createHmac, timingSafeEqual } from "node:crypto";

// Mercado Pago (Checkout Pro). Variáveis na Vercel:
//   MERCADOPAGO_ACCESS_TOKEN   → Suas integrações > aplicação > Credenciais de produção > Access Token
//   MERCADOPAGO_WEBHOOK_SECRET → Suas integrações > aplicação > Webhooks > Assinatura secreta
const API = "https://api.mercadopago.com";

export const mercadoPagoLigado = () => !!process.env.MERCADOPAGO_ACCESS_TOKEN;

function token() {
  const t = process.env.MERCADOPAGO_ACCESS_TOKEN;
  if (!t) throw new Error("MERCADOPAGO_ACCESS_TOKEN não configurado");
  return t;
}

export type Preferencia = { id: string; link: string };

/** Cria o link de pagamento do pedido. O id da conversa vai como external_reference para casar com o aviso. */
export async function criarPreferencia(p: {
  conversaId: string;
  numero: string;
  titulo: string;
  valor: number;
  nome?: string;
  email?: string;
  baseUrl: string;
}): Promise<Preferencia> {
  const voltar = `${p.baseUrl}/pedido/${p.conversaId}`;
  const r = await fetch(`${API}/checkout/preferences`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token()}`,
      "Content-Type": "application/json",
      // mesmo pedido = mesma preferência, mesmo que o botão seja tocado duas vezes
      "X-Idempotency-Key": `pref-${p.conversaId}`,
    },
    body: JSON.stringify({
      items: [
        {
          id: p.numero,
          title: p.titulo,
          quantity: 1,
          unit_price: p.valor,
          currency_id: "BRL",
        },
      ],
      payer: { ...(p.nome ? { name: p.nome } : {}), ...(p.email ? { email: p.email } : {}) },
      external_reference: p.conversaId,
      notification_url: `${p.baseUrl}/api/pagamento/webhook`,
      back_urls: { success: voltar, pending: voltar, failure: voltar },
      auto_return: "approved",
      statement_descriptor: "KRIAI",
      payment_methods: { installments: 3 },
      metadata: { numero: p.numero },
    }),
  });
  if (!r.ok) throw new Error(`Mercado Pago (preferência) respondeu ${r.status}: ${await r.text()}`);
  const d = await r.json();
  return { id: d.id, link: d.init_point };
}

export type PagamentoMP = {
  id: string;
  status: string; // approved, pending, in_process, rejected, refunded, cancelled, charged_back...
  referencia: string | null;
  valor: number;
  moeda: string;
};

/** Consulta o pagamento direto na API. O aviso do webhook só diz "algo mudou"; a verdade vem daqui. */
export async function consultarPagamento(id: string): Promise<PagamentoMP> {
  const r = await fetch(`${API}/v1/payments/${encodeURIComponent(id)}`, {
    headers: { Authorization: `Bearer ${token()}` },
    cache: "no-store",
  });
  if (!r.ok) throw new Error(`Mercado Pago (pagamento ${id}) respondeu ${r.status}`);
  const d = await r.json();
  return {
    id: String(d.id),
    status: d.status,
    referencia: d.external_reference ?? null,
    valor: Number(d.transaction_amount),
    moeda: d.currency_id,
  };
}

/**
 * Confere a assinatura do aviso (header x-signature: "ts=...,v1=...").
 * Manifesto: id:<data.id>;request-id:<x-request-id>;ts:<ts>;  HMAC-SHA256 com a assinatura secreta.
 */
export function assinaturaValida(xSignature: string | null, xRequestId: string | null, dataId: string) {
  const segredo = process.env.MERCADOPAGO_WEBHOOK_SECRET;
  if (!segredo || !xSignature) return false;
  const partes = Object.fromEntries(
    xSignature.split(",").map((p) => {
      const [k, ...v] = p.trim().split("=");
      return [k, v.join("=")];
    }),
  );
  const ts = partes.ts;
  const v1 = partes.v1;
  if (!ts || !v1) return false;
  const id = /^[a-z0-9]+$/i.test(dataId) ? dataId.toLowerCase() : dataId;
  let manifesto = `id:${id};`;
  if (xRequestId) manifesto += `request-id:${xRequestId};`;
  manifesto += `ts:${ts};`;
  const esperado = createHmac("sha256", segredo).update(manifesto).digest("hex");
  const a = Buffer.from(esperado);
  const b = Buffer.from(v1);
  return a.length === b.length && timingSafeEqual(a, b);
}
