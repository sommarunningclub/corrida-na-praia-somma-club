-- Grupo do WhatsApp atribuído a quem entrou na comunidade pelo formulário.
-- Os novos membros são distribuídos em rodízio entre os grupos de
-- lib/napraia-data.ts para que todos cresçam parelhos.

alter table public.napraia_lista_vip
  add column if not exists grupo_whatsapp smallint;

-- Fica nulo para quem já era membro (não recebe convite, já está nos grupos)
-- e para os cadastros anteriores a esta coluna.
comment on column public.napraia_lista_vip.grupo_whatsapp is
  'Número do grupo de WhatsApp sorteado em rodízio para o novo membro. Nulo para quem já era da comunidade.';

-- A contagem por grupo alimenta o rodízio a cada cadastro.
create index if not exists napraia_lista_vip_grupo_whatsapp_idx
  on public.napraia_lista_vip (grupo_whatsapp)
  where grupo_whatsapp is not null;
