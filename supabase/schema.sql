-- Banco do atendimento. Cole tudo no Supabase: menu SQL Editor > New query > Run.
-- (Projeto que já rodou a versão antiga deste arquivo: rode os arquivos 002_ e 003_ desta pasta, em ordem.)

create table if not exists conversas (
  id uuid primary key,
  criada_em timestamptz not null default now(),
  atualizada_em timestamptz not null default now(),
  status text not null default 'rascunho' check (status in ('rascunho', 'enviado')),
  numero text,
  enviada_em timestamptz,
  ficha jsonb not null default '{"servicos": []}',
  valor_minimo integer,
  aceita_novidades boolean not null default false,
  consentimento jsonb,
  origem text,
  utm jsonb not null default '{}',
  dispositivo text,
  visitante text,
  avaliacao jsonb,          -- avaliação do lead feita pela IA (área administrativa)
  avaliada_em timestamptz,
  notificada_em timestamptz, -- quando o e-mail avisando do lead foi enviado
  email_cliente_em timestamptz, -- quando a confirmação foi enviada ao cliente
  contato_avisado_em timestamptz -- quando o aviso de novo contato (antes do pedido) foi enviado
);

create table if not exists mensagens (
  id bigint generated always as identity primary key,
  conversa_id uuid not null references conversas (id) on delete cascade,
  criada_em timestamptz not null default now(),
  papel text not null check (papel in ('user', 'assistant')),
  conteudo jsonb not null, -- conteúdo completo, reenviado à IA a cada mensagem
  texto text               -- versão legível (nula nas mensagens internas da ficha)
);

create index if not exists mensagens_conversa on mensagens (conversa_id, id);
create index if not exists conversas_atualizada on conversas (atualizada_em desc);

-- Só o servidor do site (chave secreta) lê e grava. Ninguém acessa pelo navegador.
alter table conversas enable row level security;
alter table mensagens enable row level security;

-- Painel: abra esta "tabela" no Table Editor para ver todos os contatos, inclusive quem desistiu.
-- "abandonado" = rascunho sem mensagem nova há mais de 30 minutos.
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
