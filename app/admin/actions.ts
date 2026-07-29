"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import {
  ADMIN_COOKIE,
  COOKIE_OPTS,
  criarSessao,
  exigirEditor,
  exigirSessao,
  papelDoCodigo,
} from "@/lib/admin-auth";
import {
  atualizarLead,
  consultarDisparo,
  criarLead,
  excluirLead,
  sincronizarStatusEmails,
  type DetalheDisparo,
  type ResultadoSync,
} from "@/lib/admin-store";
import { definirListaVipFechada } from "@/lib/config-store";

export type EstadoAcao = { ok: boolean; mensagem: string } | null;

/* ─── Sessão ──────────────────────────────────────────────────────────────── */

// Freio de força bruta por instância: os códigos são curtos e compartilhados.
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

  const papel = papelDoCodigo(codigo);
  if (!papel) {
    return { ok: false, mensagem: "Código de acesso inválido." };
  }

  const jar = await cookies();
  jar.set(ADMIN_COOKIE, criarSessao(papel), COOKIE_OPTS);
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

function lerCampos(formData: FormData) {
  return {
    nome: String(formData.get("nome") ?? "").trim(),
    email: String(formData.get("email") ?? "").trim(),
    telefone: String(formData.get("telefone") ?? "").trim(),
    cpf: String(formData.get("cpf") ?? "").trim(),
  };
}

function validar(c: ReturnType<typeof lerCampos>): string | null {
  if (c.nome.length < 3) return "Informe o nome completo.";
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(c.email)) return "E-mail inválido.";
  if (c.telefone.replace(/\D/g, "").length < 10) {
    return "Telefone incompleto — informe DDD e número.";
  }
  if (c.cpf.replace(/\D/g, "").length !== 11) return "O CPF precisa ter 11 dígitos.";
  return null;
}

export async function salvarLead(
  _estado: EstadoAcao,
  formData: FormData
): Promise<EstadoAcao> {
  try {
    await exigirEditor();

    const id = String(formData.get("id") ?? "");
    if (!id) return { ok: false, mensagem: "Lead não identificado." };

    const campos = lerCampos(formData);
    const erro = validar(campos);
    if (erro) return { ok: false, mensagem: erro };

    await atualizarLead(id, campos);
    revalidatePath("/admin");
    return { ok: true, mensagem: "Cadastro atualizado." };
  } catch (err) {
    return { ok: false, mensagem: (err as Error).message };
  }
}

export async function adicionarLead(
  _estado: EstadoAcao,
  formData: FormData
): Promise<EstadoAcao> {
  try {
    await exigirEditor();

    const campos = lerCampos(formData);
    const erro = validar(campos);
    if (erro) return { ok: false, mensagem: erro };

    await criarLead(campos);
    revalidatePath("/admin");
    return { ok: true, mensagem: `${campos.nome} entrou na lista VIP.` };
  } catch (err) {
    return { ok: false, mensagem: (err as Error).message };
  }
}

export async function removerLead(id: string): Promise<EstadoAcao> {
  try {
    await exigirEditor();
    if (!id) return { ok: false, mensagem: "Lead não identificado." };

    await excluirLead(id);
    revalidatePath("/admin");
    return { ok: true, mensagem: "Cadastro excluído." };
  } catch (err) {
    return { ok: false, mensagem: (err as Error).message };
  }
}

/* ─── Status de e-mail ────────────────────────────────────────────────────── */

export async function sincronizarEmails(): Promise<EstadoAcao> {
  try {
    // Escreve em email_status, então é ação de editor.
    await exigirEditor();
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

export type EstadoDisparo =
  | { ok: true; detalhe: DetalheDisparo }
  | { ok: false; mensagem: string }
  | null;

/** Consulta individual: leitura pura, liberada para os dois papéis. */
export async function verDisparo(resendEmailId: string): Promise<EstadoDisparo> {
  try {
    await exigirSessao();
    return { ok: true, detalhe: await consultarDisparo(resendEmailId) };
  } catch (err) {
    return { ok: false, mensagem: (err as Error).message };
  }
}

/* ─── Formulário da lista VIP ─────────────────────────────────────────────── */

export async function alternarFormulario(fechada: boolean): Promise<EstadoAcao> {
  try {
    await exigirEditor();
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
