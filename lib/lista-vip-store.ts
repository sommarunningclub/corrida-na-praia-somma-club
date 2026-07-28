import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTA_VIP_TABLE } from "@/lib/supabase";
import { sendVipEmail } from "@/lib/emails/vip-email";
import { formatarCpf } from "@/lib/membro";

export type OrigemLead = "membro" | "novo-membro";

export type LeadVip = {
  nome: string;
  email: string;
  telefone: string;
  cpfDigits: string;
  origem: OrigemLead;
  utm_source?: string | null;
  utm_medium?: string | null;
  utm_campaign?: string | null;
};

export type ResultadoLead =
  | { ok: true; codigo: string }
  | { ok: false; status: number; error: string };

/** Grava o lead na lista VIP e devolve o código do ticket.
 *  `origem` distingue quem já era da comunidade de quem entrou agora. */
export async function gravarLead(
  supabase: SupabaseClient,
  lead: LeadVip
): Promise<ResultadoLead> {
  const { data, error } = await supabase
    .from(LISTA_VIP_TABLE)
    .insert({
      nome: lead.nome,
      email: lead.email,
      telefone: lead.telefone,
      // Mesmo formato usado em cadastro_site, para os dois casarem depois.
      cpf: formatarCpf(lead.cpfDigits),
      origem: lead.origem === "membro" ? "site-napraia-membro" : "site-napraia-novo",
      utm_source: lead.utm_source ?? null,
      utm_medium: lead.utm_medium ?? null,
      utm_campaign: lead.utm_campaign ?? null,
    })
    .select("id")
    .single();

  if (error) {
    if (error.code === "23505") {
      return { ok: false, status: 409, error: "Você já está na lista VIP!" };
    }
    if (error.code === "42P01" || error.code === "PGRST205") {
      console.error(
        `[lista-vip] Tabela ${LISTA_VIP_TABLE} não existe. Aplique supabase/migrations/0001_napraia_lista_vip.sql.`
      );
      return {
        ok: false,
        status: 503,
        error: "Cadastro indisponível no momento. Tente novamente em instantes.",
      };
    }
    console.error("[lista-vip] Erro ao inserir lead:", error);
    return { ok: false, status: 500, error: "Ocorreu um erro. Tente novamente." };
  }

  // O e-mail não bloqueia a resposta: o lead já está salvo. Hoje está
  // desligado por VIP_EMAIL_ENABLED e a função retorna null na hora.
  const resendId = await sendVipEmail({ nome: lead.nome, email: lead.email });
  if (resendId) {
    await supabase
      .from(LISTA_VIP_TABLE)
      .update({
        resend_email_id: resendId,
        email_status: "sent",
        email_sent_at: new Date().toISOString(),
      })
      .eq("id", data.id);
  }

  return { ok: true, codigo: codigoDoTicket(data.id) };
}

/** Código curto e legível para o ticket, derivado do uuid do lead.
 *  Referência visual na página de obrigado, não credencial. */
export function codigoDoTicket(id: string): string {
  return `NP-${id.replace(/-/g, "").slice(0, 6).toUpperCase()}`;
}

/** UTMs saneadas, vindas do corpo da requisição. */
export function lerUtms(payload: unknown): Pick<
  LeadVip,
  "utm_source" | "utm_medium" | "utm_campaign"
> {
  const p = (payload ?? {}) as Record<string, unknown>;
  const limpar = (v: unknown) =>
    typeof v === "string" && v.length > 0 ? v.slice(0, 120) : null;
  return {
    utm_source: limpar(p.utm_source),
    utm_medium: limpar(p.utm_medium),
    utm_campaign: limpar(p.utm_campaign),
  };
}
