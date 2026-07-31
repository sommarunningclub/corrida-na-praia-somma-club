import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTA_VIP_TABLE } from "@/lib/supabase";
import { sendVipEmail } from "@/lib/emails/vip-email";
import { agendarOndasFuturas } from "@/lib/emails/disparo-store";
import { formatarCpf } from "@/lib/membro";
import { urlDoGrupo } from "@/lib/napraia-data";

export type OrigemLead = "membro" | "novo-membro";

export type LeadVip = {
  nome: string;
  email: string;
  telefone: string;
  cpfDigits: string;
  origem: OrigemLead;
  /** Grupo do WhatsApp sorteado para quem acabou de virar membro.
   *  Nulo para quem já era da comunidade: essa pessoa já está nos grupos. */
  grupoWhatsapp?: number | null;
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
  const linha: Record<string, unknown> = {
    nome: lead.nome,
    email: lead.email,
    telefone: lead.telefone,
    // Mesmo formato usado em cadastro_site, para os dois casarem depois.
    cpf: formatarCpf(lead.cpfDigits),
    origem: lead.origem === "membro" ? "site-napraia-membro" : "site-napraia-novo",
    grupo_whatsapp: lead.grupoWhatsapp ?? null,
    utm_source: lead.utm_source ?? null,
    utm_medium: lead.utm_medium ?? null,
    utm_campaign: lead.utm_campaign ?? null,
  };

  const inserir = () =>
    supabase.from(LISTA_VIP_TABLE).insert(linha).select("id").single();

  const primeira = await inserir();

  // PGRST204 = coluna inexistente. Acontece se o deploy chegar antes da
  // migration 0002: perder o grupo é aceitável, perder o cadastro não.
  if (primeira.error?.code === "PGRST204") {
    console.error(
      "[lista-vip] Coluna grupo_whatsapp ausente. Aplique supabase/migrations/0002_grupo_whatsapp.sql."
    );
    delete linha.grupo_whatsapp;
  }

  const { data, error } =
    primeira.error?.code === "PGRST204" ? await inserir() : primeira;

  if (error || !data) {
    if (error?.code === "23505") {
      return { ok: false, status: 409, error: "Você já está na lista VIP!" };
    }
    if (error?.code === "42P01" || error?.code === "PGRST205") {
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
  // O convite ao grupo também vai no e-mail: o comprovante da tela vive em
  // sessionStorage e morre quando a aba fecha, então o e-mail é a segunda
  // (e permanente) chance de a pessoa entrar no grupo.
  const resendId = await sendVipEmail({
    nome: lead.nome,
    email: lead.email,
    grupoUrl: urlDoGrupo(lead.grupoWhatsapp),
  });
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

  // Quem entra na lista durante a campanha entra também nas ondas que ainda
  // não saíram. Fica depois do e-mail de confirmação e fora do caminho de
  // erro: campanha é acessório, o cadastro é o que não pode falhar.
  try {
    await agendarOndasFuturas({
      id: data.id as string,
      nome: lead.nome,
      email: lead.email,
    });
  } catch (err) {
    console.error("[lista-vip] Não foi possível colocar o lead nas ondas:", err);
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
