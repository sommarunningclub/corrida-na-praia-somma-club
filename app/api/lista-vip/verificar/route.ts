import { NextResponse } from "next/server";
import { getServiceSupabase, LISTA_VIP_TABLE } from "@/lib/supabase";
import { onlyDigits } from "@/lib/validation";
import { listaVipFechada, MSG_FECHADA } from "@/lib/config-store";
import {
  CPF_TABELA_MEMBROS,
  criarTokenMembro,
  excedeuTentativas,
  formatosDeCpf,
  ipDaRequisicao,
  mascararEmail,
  mascararNome,
  mascararTelefone,
} from "@/lib/membro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Primeira etapa da lista VIP: descobre se o CPF já é da comunidade Somma.
 *
 * Devolve apenas uma prévia mascarada dos dados — o suficiente para a pessoa
 * se reconhecer. Os dados completos nunca saem do servidor: quem grava o lead
 * é a rota /confirmar, que relê o cadastro a partir do token assinado.
 */
export async function POST(request: Request) {
  if (await listaVipFechada()) {
    return NextResponse.json({ error: MSG_FECHADA, fechada: true }, { status: 403 });
  }

  if (excedeuTentativas(ipDaRequisicao(request))) {
    return NextResponse.json(
      { error: "Muitas tentativas seguidas. Aguarde alguns minutos." },
      { status: 429 }
    );
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  const cpfBruto = (payload as { cpf?: unknown } | null)?.cpf;
  const cpf = typeof cpfBruto === "string" ? onlyDigits(cpfBruto) : "";

  // Só exige 11 dígitos: esta rota apenas consulta. Um CPF com dígito
  // verificador errado simplesmente não é encontrado e a pessoa segue para o
  // cadastro, onde o campo fica visível para correção. Sem erro no caminho.
  if (cpf.length !== 11) {
    return NextResponse.json({ error: "Informe os 11 dígitos do CPF." }, { status: 422 });
  }

  const supabase = getServiceSupabase();
  if (!supabase) {
    return NextResponse.json(
      { error: "Cadastro indisponível no momento. Tente novamente em instantes." },
      { status: 503 }
    );
  }

  const variacoes = formatosDeCpf(cpf);

  // Já entrou na lista VIP antes? Evita duplicar e dá um retorno claro.
  const { data: jaNaLista } = await supabase
    .from(LISTA_VIP_TABLE)
    .select("id")
    .in("cpf", variacoes)
    .limit(1);

  if (jaNaLista && jaNaLista.length > 0) {
    return NextResponse.json({ status: "ja_na_lista" });
  }

  const { data, error } = await supabase
    .from(CPF_TABELA_MEMBROS)
    .select("nome_completo, email, whatsapp")
    .in("cpf", variacoes)
    .limit(1);

  if (error) {
    console.error("[lista-vip/verificar] Erro ao consultar membros:", error);
    return NextResponse.json({ error: "Ocorreu um erro. Tente novamente." }, { status: 500 });
  }

  const membro = data?.[0];
  if (!membro) {
    return NextResponse.json({ status: "novo" });
  }

  return NextResponse.json({
    status: "membro",
    token: criarTokenMembro(cpf),
    previa: {
      nome: mascararNome(membro.nome_completo ?? ""),
      email: mascararEmail(membro.email ?? ""),
      telefone: mascararTelefone(membro.whatsapp ?? ""),
    },
  });
}
