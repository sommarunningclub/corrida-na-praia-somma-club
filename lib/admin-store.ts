import "server-only";
import { Resend } from "resend";
import { getServiceSupabase, LISTA_VIP_TABLE } from "@/lib/supabase";
import type { LeadAdmin } from "@/lib/admin-tipos";

const CAMPOS =
  "id, nome, email, telefone, cpf, origem, utm_source, utm_medium, utm_campaign, resend_email_id, email_status, email_sent_at, created_at";

export async function listarLeads(): Promise<LeadAdmin[]> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível — confira as variáveis de ambiente.");

  const { data, error } = await supabase
    .from(LISTA_VIP_TABLE)
    .select(CAMPOS)
    .order("created_at", { ascending: false });

  if (error) throw new Error(`Falha ao carregar os leads: ${error.message}`);
  return (data ?? []) as LeadAdmin[];
}

/* ─── Edição ──────────────────────────────────────────────────────────────── */

export type CamposEditaveis = {
  nome: string;
  email: string;
  telefone: string;
  cpf: string;
};

export async function atualizarLead(
  id: string,
  campos: CamposEditaveis
): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const { error } = await supabase
    .from(LISTA_VIP_TABLE)
    .update({
      nome: campos.nome.trim(),
      email: campos.email.trim().toLowerCase(),
      telefone: campos.telefone.trim(),
      cpf: campos.cpf.trim(),
    })
    .eq("id", id);

  if (error) {
    // A tabela tem índice único em lower(email) e em cpf.
    if (error.code === "23505") {
      throw new Error("Já existe outro cadastro com esse e-mail ou CPF.");
    }
    throw new Error(`Não foi possível salvar: ${error.message}`);
  }
}

/* ─── Status de entrega no Resend ─────────────────────────────────────────── */

export type ResultadoSync = {
  consultados: number;
  atualizados: number;
  falhas: number;
  semId: number;
};

/**
 * Pergunta ao Resend o último evento de cada e-mail e grava em `email_status`.
 *
 * O Resend limita a 2 requisições por segundo, então isto vai em duplas com
 * respiro entre elas: uma sincronização completa da lista leva ~20s. É uma
 * ação manual justamente por isso.
 */
export async function sincronizarStatusEmails(): Promise<ResultadoSync> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não está configurada no ambiente.");

  const { data, error } = await supabase
    .from(LISTA_VIP_TABLE)
    .select("id, resend_email_id, email_status");

  if (error) throw new Error(`Falha ao ler os leads: ${error.message}`);

  const linhas = data ?? [];
  const comId = linhas.filter((l) => l.resend_email_id);
  const resend = new Resend(apiKey);

  const resultado: ResultadoSync = {
    consultados: comId.length,
    atualizados: 0,
    falhas: 0,
    semId: linhas.length - comId.length,
  };

  for (let i = 0; i < comId.length; i += 2) {
    const dupla = comId.slice(i, i + 2);

    await Promise.all(
      dupla.map(async (lead) => {
        try {
          const { data: email, error: erroResend } = await resend.emails.get(
            lead.resend_email_id as string
          );

          if (erroResend || !email) {
            resultado.falhas += 1;
            return;
          }

          const evento =
            (email as { last_event?: string }).last_event ?? "sent";

          if (evento === lead.email_status) return;

          const { error: erroUpdate } = await supabase
            .from(LISTA_VIP_TABLE)
            .update({ email_status: evento })
            .eq("id", lead.id);

          if (erroUpdate) resultado.falhas += 1;
          else resultado.atualizados += 1;
        } catch {
          resultado.falhas += 1;
        }
      })
    );

    if (i + 2 < comId.length) {
      await new Promise((r) => setTimeout(r, 550));
    }
  }

  return resultado;
}
