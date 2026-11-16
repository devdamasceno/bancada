-- Área administrativa: avaliação do lead e controle da notificação por e-mail.
-- Rode uma vez no Supabase: SQL Editor > New query > cole tudo > Run. Pode rodar de novo sem problema.

alter table conversas add column if not exists avaliacao jsonb;          -- nota, temperatura, resumo, próximo passo...
alter table conversas add column if not exists avaliada_em timestamptz;
alter table conversas add column if not exists notificada_em timestamptz; -- quando o e-mail do lead foi enviado

-- O painel ganha a avaliação no fim (colunas novas só podem entrar no final da view).
create or replace view painel_pedidos with (security_invoker = true) as
select
  c.id,
  case
    when c.status = 'enviado' then 'enviado'
    when c.atualizada_em < now() - interval '30 minutes' then 'abandonado'
    else 'conversando'
  end as situacao,
  c.numero,
  c.atualizada_em,
  c.ficha ->> 'nome' as nome,
  c.ficha ->> 'whatsapp' as whatsapp,
  c.ficha ->> 'email' as email,
  c.ficha ->> 'negocio' as negocio,
  c.ficha ->> 'cidade' as cidade,
  c.ficha -> 'servicos' as servicos,
  c.valor_minimo,
  c.ficha ->> 'objetivo' as objetivo,
  c.ficha ->> 'ja_tem' as ja_tem,
  c.ficha ->> 'prazo' as prazo,
  c.ficha ->> 'investimento' as investimento,
  c.ficha ->> 'observacoes' as observacoes,
  c.aceita_novidades,
  c.origem,
  c.utm,
  c.dispositivo,
  (select count(*) from mensagens m where m.conversa_id = c.id and m.papel = 'user' and m.texto is not null) as mensagens_do_cliente,
  (select string_agg(case m.papel when 'user' then 'Cliente: ' else 'IA: ' end || m.texto, E'\n' order by m.id)
     from mensagens m where m.conversa_id = c.id and m.texto is not null) as conversa,
  (c.avaliacao ->> 'nota')::int as nota,
  c.avaliacao ->> 'temperatura' as temperatura,
  c.avaliacao ->> 'resumo' as resumo,
  c.avaliacao ->> 'proximo_passo' as proximo_passo,
  c.criada_em,
  c.enviada_em,
  c.notificada_em
from conversas c
order by c.atualizada_em desc;

revoke all on painel_pedidos from anon, authenticated;
