import { NextResponse } from "next/server";
import { getServiceSupabase, LISTA_VIP_TABLE } from "@/lib/supabase";
import { listaVipSchema, onlyDigits } from "@/lib/validation";
import { sendVipEmail } from "@/lib/emails/vip-email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // Honeypot antes de validar: o bot recebe o mesmo 200 de um envio real,
  // sem pista de que o campo o denunciou.
  const honeypot = (payload as { website?: unknown } | null)?.website;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return NextResponse.json({ ok: true });
  }

  const parsed = listaVipSchema.safeParse(payload);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const first = Object.values(fields).flat()[0];
    return NextResponse.json(
      { error: first ?? "Confira os dados do formulário.", fields },
      { status: 422 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Cadastro indisponível no momento. Tente novamente em instantes." },
      { status: 503 }
    );
  }

  const lead = {
    nome: parsed.data.nome,
    email: parsed.data.email,
    telefone: onlyDigits(parsed.data.telefone),
    cpf: onlyDigits(parsed.data.cpf),
    origem: "site-napraia",
    utm_source: parsed.data.utm_source ?? null,
    utm_medium: parsed.data.utm_medium ?? null,
    utm_campaign: parsed.data.utm_campaign ?? null,
  };

  const { data, error } = await supabase
    .from(LISTA_VIP_TABLE)
    .insert(lead)
    .select("id")
    .single();

  if (error) {
    // 23505 = unique_violation (e-mail ou CPF já cadastrado).
    if (error.code === "23505") {
      return NextResponse.json(
        { error: "Você já está na lista VIP! Confira seu e-mail." },
        { status: 409 }
      );
    }
    // Tabela inexistente (42P01 no Postgres, PGRST205 no PostgREST):
    // a migration ainda não foi aplicada neste projeto Supabase.
    if (error.code === "42P01" || error.code === "PGRST205") {
      console.error(
        `[lista-vip] Tabela ${LISTA_VIP_TABLE} não existe. Aplique supabase/migrations/0001_napraia_lista_vip.sql.`
      );
      return NextResponse.json(
        { error: "Cadastro indisponível no momento. Tente novamente em instantes." },
        { status: 503 }
      );
    }
    console.error("[lista-vip] Erro ao inserir lead:", error);
    return NextResponse.json(
      { error: "Ocorreu um erro. Tente novamente." },
      { status: 500 }
    );
  }

  // O e-mail não bloqueia a resposta de sucesso: o lead já está salvo.
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

  return NextResponse.json({
    ok: true,
    emailEnviado: Boolean(resendId),
    codigo: codigoDoTicket(data.id),
  });
}

/** Código curto e legível para o ticket, derivado do uuid do lead.
 *  Serve como referência visual na página de obrigado, não como credencial. */
function codigoDoTicket(id: string): string {
  const hex = id.replace(/-/g, "").slice(0, 6).toUpperCase();
  return `NP-${hex}`;
}
