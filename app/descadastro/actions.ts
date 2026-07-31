"use server";

import { descadastrar } from "@/lib/descadastro";

export type EstadoSaida = { ok: boolean; mensagem: string } | null;

/** Confirmação do descadastro pela página. A escrita fica em POST de propósito:
 *  varredura de link de e-mail abre a página em GET e não pode tirar ninguém
 *  da lista sem a pessoa clicar. */
export async function confirmarSaida(
  _estado: EstadoSaida,
  formData: FormData
): Promise<EstadoSaida> {
  const token = String(formData.get("t") ?? "");
  const r = await descadastrar(token);

  if (!r.ok) return { ok: false, mensagem: r.mensagem };

  return {
    ok: true,
    mensagem: r.jaEstava
      ? `${r.email} já estava fora da lista.`
      : `Pronto. ${r.email} não recebe mais nossos e-mails.`,
  };
}
