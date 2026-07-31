-- Campanhas de e-mail para a base da lista VIP.
--
-- O e-mail transacional do cadastro já tem lugar próprio em
-- napraia_lista_vip (resend_email_id, email_status, email_sent_at). Uma
-- campanha é outra coisa: a mesma pessoa recebe vários disparos ao longo do
-- tempo e cada um tem o seu próprio ciclo de entrega. Por isso tabela
-- separada, uma linha por pessoa por onda.

create table if not exists public.napraia_disparos (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.napraia_lista_vip(id) on delete cascade,
  -- Identificador da onda, ex.: 'corre-01-08-onda-1'.
  campanha text not null,
  resend_email_id text,
  email_status text,
  -- Quando o Resend deve soltar o e-mail. Nulo = enviado na hora.
  agendado_para timestamptz,
  -- Motivo da recusa, quando o Resend não aceitou o envio.
  erro text,
  created_at timestamptz not null default now()
);

-- Trava de segurança do disparo em massa: rodar a mesma onda duas vezes por
-- engano não manda o e-mail duas vezes para a mesma pessoa.
create unique index if not exists napraia_disparos_lead_campanha_key
  on public.napraia_disparos (lead_id, campanha);

create index if not exists napraia_disparos_campanha_idx
  on public.napraia_disparos (campanha, created_at desc);

alter table public.napraia_disparos enable row level security;

comment on table public.napraia_disparos is
  'Disparos de campanha para a lista VIP do NaPraia-Somma-Club. Uma linha por pessoa por onda. Acesso apenas via service_role.';

-- Quem pediu para sair da lista. Preenchido pela página /descadastro.
-- Coluna em vez de exclusão: apagar a linha faria a pessoa voltar a receber
-- no próximo cadastro e ainda sumiria com o histórico de disparos.
alter table public.napraia_lista_vip
  add column if not exists descadastrado_em timestamptz;

comment on column public.napraia_lista_vip.descadastrado_em is
  'Data em que a pessoa pediu para sair da lista. Preenchida = não recebe campanha.';
