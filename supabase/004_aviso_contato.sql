-- Aviso de novo contato: e-mail para você assim que o cliente deixa WhatsApp ou e-mail na conversa,
-- mesmo antes de enviar o pedido. Esta coluna garante que o aviso sai uma vez só por conversa.
-- Rode uma vez no Supabase: SQL Editor > New query (aba vazia) > cole > Run. Pode rodar de novo sem problema.
alter table conversas add column if not exists contato_avisado_em timestamptz;
