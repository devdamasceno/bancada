-- E-mail de confirmação para o cliente (registro do pedido + cópia da conversa).
-- Rode uma vez no Supabase: SQL Editor > New query (aba vazia) > cole > Run. Pode rodar de novo sem problema.
alter table conversas add column if not exists email_cliente_em timestamptz;
