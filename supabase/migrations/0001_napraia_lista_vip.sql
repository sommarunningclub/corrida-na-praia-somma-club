-- Lista VIP da collab Somma Club & R2 no Na Praia Festival (06/09/2026)
-- Projeto Supabase: riqfjewvygqsbuokvsjw (compartilhado com os demais sites Somma)

create table if not exists public.napraia_lista_vip (
  id uuid primary key default gen_random_uuid(),
  nome text not null,
  email text not null,
  telefone text not null,
  cpf text not null,
  origem text not null default 'site-napraia',
  utm_source text,
  utm_medium text,
  utm_campaign text,
  resend_email_id text,
  email_status text,
  email_sent_at timestamptz,
  created_at timestamptz not null default now()
);

-- Um cadastro por pessoa: e-mail (case-insensitive) e CPF são únicos.
create unique index if not exists napraia_lista_vip_email_key
  on public.napraia_lista_vip (lower(email));
create unique index if not exists napraia_lista_vip_cpf_key
  on public.napraia_lista_vip (cpf);
create index if not exists napraia_lista_vip_created_at_idx
  on public.napraia_lista_vip (created_at desc);

-- RLS ligado e sem policies: apenas a service_role (server-side) lê/escreve.
-- A anon key nunca toca nesta tabela — o insert passa pela API route.
alter table public.napraia_lista_vip enable row level security;

comment on table public.napraia_lista_vip is
  'Leads da Lista VIP do site NaPraia-Somma-Club (Somma Club e R2 no Na Praia Festival, 06/09/2026). Acesso apenas via service_role.';
