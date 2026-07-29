import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { CPF_TABELA_MEMBROS, formatosDeCpf, lerTokenMembro } from "@/lib/membro";
import { gravarLead, lerUtms } from "@/lib/lista-vip-store";
import { onlyDigits } from "@/lib/validation";
import { listaVipFechada, MSG_FECHADA } from "@/lib/config-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Segunda etapa de quem já é da comunidade: confirma e entra na lista VIP.
 *
 * O cliente manda só o token da etapa anterior. O CPF sai do token assinado e
 * os dados completos são relidos de cadastro_site aqui no servidor, então o
 * navegador nunca precisou receber (nem devolver) nome, e-mail ou telefone.
 */
export async function POST(request: Request) {
  if (await listaVipFechada()) {
    return NextResponse.json({ error: MSG_FECHADA, fechada: true }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const token = (payload as { token?: unknown } | null)?.token;
  const cpf = typeof token === "string" ? lerTokenMembro(token) : null;

  if (!cpf) {
    return NextResponse.json(
      { error: "Sua sessão expirou. Informe o CPF novamente.", expirado: true },
      { status: 401 }
    );
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Cadastro indisponível no momento. Tente novamente em instantes." },
      { status: 503 }
    );
  }

  const { data, error } = await supabase
    .from(CPF_TABELA_MEMBROS)
    .select("nome_completo, email, whatsapp")
    .in("cpf", formatosDeCpf(cpf))
    .limit(1);

  if (error) {
    console.error("[lista-vip/confirmar] Erro ao consultar membro:", error);
    return NextResponse.json({ error: "Ocorreu um erro. Tente novamente." }, { status: 500 });
  }

  const membro = data?.[0];
  if (!membro) {
    return NextResponse.json(
      { error: "Não encontramos seu cadastro. Faça o cadastro completo." },
      { status: 404 }
    );
  }

  const resultado = await gravarLead(supabase, {
    nome: (membro.nome_completo ?? "").trim(),
    email: (membro.email ?? "").trim().toLowerCase(),
    telefone: onlyDigits(membro.whatsapp ?? ""),
    cpfDigits: cpf,
    origem: "membro",
    ...lerUtms(payload),
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  return NextResponse.json({
    ok: true,
    codigo: resultado.codigo,
    novoMembro: false,
    // Devolve os dados completos só agora, para o ticket da página de obrigado.
    dados: {
      nome: (membro.nome_completo ?? "").trim(),
      email: (membro.email ?? "").trim().toLowerCase(),
      telefone: (membro.whatsapp ?? "").trim(),
    },
  });
}
