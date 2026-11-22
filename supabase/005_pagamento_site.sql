-- Pagamento pelo Mercado Pago, domínio e geração automática do site.
-- Rode depois do 004_. Pode rodar de novo sem problema.

alter table conversas add column if not exists valor_cobrado integer;            -- em reais, o que foi cobrado no link
alter table conversas add column if not exists mp_preferencia text;              -- id da preferência do Checkout Pro
alter table conversas add column if not exists mp_link text;                     -- link de pagamento enviado ao cliente
alter table conversas add column if not exists pagamento_status text
  check (pagamento_status in ('aguardando', 'aprovado', 'recusado', 'estornado'));
alter table conversas add column if not exists mp_pagamento_id text;
alter table conversas add column if not exists pago_em timestamptz;

alter table conversas add column if not exists dominio text;                     -- ex.: barbeariaesquina.com.br
alter table conversas add column if not exists dominio_status text
  check (dominio_status in ('livre', 'ocupado', 'do_cliente', 'apontado', 'indefinido'));

alter table conversas add column if not exists site_slug text unique;            -- vira <slug>.kriai.online
alter table conversas add column if not exists site_status text
  check (site_status in ('na_fila', 'gerando', 'publicado', 'erro'));
alter table conversas add column if not exists site_url text;
alter table conversas add column if not exists geracao_disparada_em timestamptz; -- trava contra disparo duplo
alter table conversas add column if not exists site_publicado_em timestamptz;
alter table conversas add column if not exists site_obs text;                    -- nota da geração (erro, pendências)

create index if not exists conversas_pagamento_idx on conversas (pagamento_status) where pagamento_status is not null;
create index if not exists conversas_site_idx on conversas (site_status) where site_status is not null;
