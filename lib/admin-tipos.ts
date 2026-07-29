/** Tipos e rótulos compartilhados entre o servidor e o painel.
 *  Fica fora de `admin-store` de propósito: aquele módulo é server-only e o
 *  painel roda no navegador. */

export type LeadAdmin = {
  id: string;
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
  origem: string;
  /** Grupo do WhatsApp sorteado no cadastro. Nulo para quem já era membro. */
  grupo_whatsapp: number | null;
  utm_source: string | null;
  utm_medium: string | null;
  utm_campaign: string | null;
  resend_email_id: string | null;
  email_status: string | null;
  email_sent_at: string | null;
  created_at: string;
};

/** Eventos que o Resend devolve em `last_event`, em português. */
export const ROTULO_STATUS: Record<string, string> = {
  sent: "Enviado",
  delivered: "Entregue",
  delivery_delayed: "Atrasado",
  opened: "Aberto",
  clicked: "Clicado",
  bounced: "Devolvido",
  complained: "Spam",
  // O Resend bloqueia o envio para endereços que já deram bounce/reclamação.
  suppressed: "Suprimido",
  failed: "Falhou",
  canceled: "Cancelado",
  queued: "Na fila",
  scheduled: "Agendado",
  nao_enviado: "Não enviado",
};

/** Valores gravados em `origem` pelas duas pontas do formulário. */
export const ORIGEM_MEMBRO = "site-napraia-membro";
export const ORIGEM_NOVO = "site-napraia-novo";
/** Quem a equipe cadastrou à mão pelo painel. */
export const ORIGEM_PAINEL = "admin-painel";

export const ORIGEM_ROTULO: Record<string, string> = {
  [ORIGEM_MEMBRO]: "Já era membro",
  [ORIGEM_NOVO]: "Novo membro",
  [ORIGEM_PAINEL]: "Cadastro manual",
};
