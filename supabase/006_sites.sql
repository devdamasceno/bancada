-- Sites das landing pages geradas automaticamente, servidos em <slug>.kriai.online.
create table if not exists sites (
  slug text primary key,
  conversa_id uuid references conversas(id) on delete set null,
  html text not null,
  versao integer not null default 1,
  modelo text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table sites enable row level security; -- só o servidor (chave secreta) lê e grava
create index if not exists sites_conversa_idx on sites (conversa_id);
