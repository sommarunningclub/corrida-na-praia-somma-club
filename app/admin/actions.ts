"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  COOKIE_OPTS,
  codigoConfere,
  criarSessao,
  exigirAdmin,
} from "@/lib/admin-auth";
import {
  atualizarLead,
  sincronizarStatusEmails,
  type ResultadoSync,
} from "@/lib/admin-store";
import { definirListaVipFechada } from "@/lib/config-store";

export type EstadoAcao = { ok: boolean; mensagem: string } | null;

/* ─── Sessão ──────────────────────────────────────────────────────────────── */

// Freio de força bruta por instância: o código é curto e único para a equipe.
const tentativas = new Map<string, { n: number; ate: number }>();
const JANELA_MS = 5 * 60 * 1000;
const MAX = 10;

function bloqueado(chave: string): boolean {
  const agora = Date.now();
  const atual = tentativas.get(chave);
  if (!atual || agora > atual.ate) {
    tentativas.set(chave, { n: 1, ate: agora + JANELA_MS });
    return false;
  }
  atual.n += 1;
  return atual.n > MAX;
}

export async function entrar(_estado: EstadoAcao, formData: FormData): Promise<EstadoAcao> {
  const codigo = String(formData.get("codigo") ?? "");

  if (bloqueado("global")) {
    return { ok: false, mensagem: "Muitas tentativas. Aguarde alguns minutos." };
  }

  if (!codigoConfere(codigo)) {
    return { ok: false, mensagem: "Código de acesso inválido." };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, criarSessao(), COOKIE_OPTS);
  tentativas.delete("global");

  revalidatePath("/admin");
  return { ok: true, mensagem: "" };
}

export async function sair(): Promise<void> {
  const jar = await cookies();
  jar.delete(ADMIN_COOKIE);
  revalidatePath("/admin");
}

/* ─── Leads ───────────────────────────────────────────────────────────────── */

export async function salvarLead(
  _estado: EstadoAcao,
  formData: FormData
): Promise<EstadoAcao> {
  try {
    await exigirAdmin();

    const id = String(formData.get("id") ?? "");
    const nome = String(formData.get("nome") ?? "").trim();
    const email = String(formData.get("email") ?? "").trim();
    const telefone = String(formData.get("telefone") ?? "").trim();
    const cpf = String(formData.get("cpf") ?? "").trim();

    if (!id) return { ok: false, mensagem: "Lead não identificado." };
    if (nome.length < 3) return { ok: false, mensagem: "Informe o nome completo." };
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) {
      return { ok: false, mensagem: "E-mail inválido." };
    }

    await atualizarLead(id, { nome, email, telefone, cpf });
    revalidatePath("/admin");
    return { ok: true, mensagem: "Cadastro atualizado." };
  } catch (err) {
    return { ok: false, mensagem: (err as Error).message };
  }
}

/* ─── Status de e-mail ────────────────────────────────────────────────────── */

export type EstadoSync = { ok: boolean; mensagem: string } | null;

export async function sincronizarEmails(): Promise<EstadoSync> {
  try {
    await exigirAdmin();
    const r: ResultadoSync = await sincronizarStatusEmails();
    revalidatePath("/admin");

    const partes = [`${r.consultados} consultados`, `${r.atualizados} atualizados`];
    if (r.falhas) partes.push(`${r.falhas} sem resposta`);
    if (r.semId) partes.push(`${r.semId} sem e-mail enviado`);

    return { ok: true, mensagem: partes.join(" · ") };
  } catch (err) {
    return { ok: false, mensagem: (err as Error).message };
  }
}

/* ─── Formulário da lista VIP ─────────────────────────────────────────────── */

export async function alternarFormulario(fechada: boolean): Promise<EstadoAcao> {
  try {
    await exigirAdmin();
    await definirListaVipFechada(fechada);
    revalidatePath("/admin");
    revalidatePath("/");
    return {
      ok: true,
      mensagem: fechada
        ? "Formulário fechado. O site já não aceita novos cadastros."
        : "Formulário reaberto. O site voltou a aceitar cadastros.",
    };
  } catch (err) {
    return { ok: false, mensagem: (err as Error).message };
  }
}
