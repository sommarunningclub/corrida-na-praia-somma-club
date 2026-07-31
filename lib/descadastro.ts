import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { getServiceSupabase, LISTA_VIP_TABLE } from "@/lib/supabase";

/**
 * Link de descadastro dos e-mails de campanha.
 *
 * O link vai dentro do e-mail, então precisa funcionar sem sessão e sem
 * login. O que o torna seguro é a assinatura: o id do lead viaja junto de um
 * HMAC, e sem o segredo do servidor ninguém consegue montar um link válido
 * para o cadastro de outra pessoa.
 *
 * Mesmo segredo da sessão do painel (ver lib/admin-auth.ts): um segredo a
 * menos para configurar em produção.
 */

function segredo(): string {
  const s =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.LISTA_VIP_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("[descadastro] Nenhum segredo disponível para assinar o link.");
  return s;
}

function assinar(leadId: string): string {
  return createHmac("sha256", segredo()).update(`descadastro.${leadId}`).digest("base64url");
}

function iguais(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function tokenDescadastro(leadId: string): string {
  return `${leadId}.${assinar(leadId)}`;
}

/** Id do lead se a assinatura conferir, ou null se o link foi adulterado. */
export function leadDoToken(token: string): string | null {
  const corte = token.lastIndexOf(".");
  if (corte < 1) return null;

  const leadId = token.slice(0, corte);
  const assinatura = token.slice(corte + 1);
  if (!iguais(assinatura, assinar(leadId))) return null;
  return leadId;
}

export function urlDescadastro(base: string, leadId: string): string {
  return `${base}/descadastro?t=${encodeURIComponent(tokenDescadastro(leadId))}`;
}

export type ResultadoDescadastro =
  | { ok: true; email: string; jaEstava: boolean }
  | { ok: false; mensagem: string };

/** Marca a pessoa como descadastrada. Idempotente: repetir não é erro. */
export async function descadastrar(token: string): Promise<ResultadoDescadastro> {
  const leadId = leadDoToken(token);
  if (!leadId) return { ok: false, mensagem: "Este link de descadastro não é válido." };

  const supabase = getServiceSupabase();
  if (!supabase) return { ok: false, mensagem: "Serviço indisponível. Tente novamente." };

  const { data, error } = await supabase
    .from(LISTA_VIP_TABLE)
    .select("id, email, descadastrado_em")
    .eq("id", leadId)
    .maybeSingle();

  if (error) return { ok: false, mensagem: "Não foi possível concluir agora." };
  if (!data) return { ok: false, mensagem: "Este cadastro não está mais na lista." };

  if (data.descadastrado_em) {
    return { ok: true, email: data.email as string, jaEstava: true };
  }

  const { error: erroUpdate } = await supabase
    .from(LISTA_VIP_TABLE)
    .update({ descadastrado_em: new Date().toISOString() })
    .eq("id", leadId);

  if (erroUpdate) return { ok: false, mensagem: "Não foi possível concluir agora." };

  return { ok: true, email: data.email as string, jaEstava: false };
}
