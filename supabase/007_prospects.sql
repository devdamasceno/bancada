-- Leads prospectados no Google Maps pelo painel (/admin/prospeccao).
create table if not exists prospects (
  place_id text primary key,
  nome text not null,
  segmento text not null,
  local text not null,
  endereco text,
  telefone text,
  celular boolean not null default false,
  site text,
  instagram text,
  maps_url text,
  nota_google numeric,
  avaliacoes integer,
  ultima_atividade timestamptz,
  pontuacao integer not null,
  motivos text[] not null default '{}',
  status text not null default 'novo' check (status in ('novo','contatado','interessado','descartado','cliente')),
  observacao text,
  criado_em timestamptz not null default now(),
  atualizado_em timestamptz not null default now()
);
alter table prospects enable row level security;
create index if not exists prospects_busca_idx on prospects (segmento, local, pontuacao desc);
create index if not exists prospects_status_idx on prospects (status);
