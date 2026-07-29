import { NextResponse } from "next/server";
import { getServiceSupabase } from "@/lib/supabase";
import { CPF_TABELA_MEMBROS, formatarCpf, formatosDeCpf } from "@/lib/membro";
import { gravarLead, lerUtms } from "@/lib/lista-vip-store";
import { proximoGrupo } from "@/lib/grupos";
import { brDateToISO, novoMembroSchema, onlyDigits } from "@/lib/validation";
import { maskPhone } from "@/lib/validation";
import { listaVipFechada, MSG_FECHADA } from "@/lib/config-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Caminho de quem ainda não é da comunidade: vira membro do Somma Club
 * (cadastro_site) e entra na lista VIP na mesma ação.
 */
export async function POST(request: Request) {
  // O fechamento vale no servidor, não só na tela: esconder o formulário não
  // impediria um POST direto no endpoint.
  if (await listaVipFechada()) {
    return NextResponse.json({ error: MSG_FECHADA, fechada: true }, { status: 403 });
  }

  let payload: unknown;
  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Requisição inválida." }, { status: 400 });
  }

  // Honeypot antes de validar: o bot recebe o mesmo 200 de um envio real.
  const honeypot = (payload as { website?: unknown } | null)?.website;
  if (typeof honeypot === "string" && honeypot.length > 0) {
    return NextResponse.json({ ok: true, codigo: null, novoMembro: true });
  }

  const parsed = novoMembroSchema.safeParse(payload);
  if (!parsed.success) {
    const fields = parsed.error.flatten().fieldErrors as Record<string, string[]>;
    const primeiro = Object.values(fields).flat()[0];
    return NextResponse.json(
      { error: primeiro ?? "Confira os dados do formulário.", fields },
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

  const dados = parsed.data;
  const cpfDigits = onlyDigits(dados.cpf);
  const variacoes = formatosDeCpf(cpfDigits);

  // Alguém pode ter se cadastrado entre a etapa do CPF e o envio: se já for
  // membro, não duplica em cadastro_site, apenas segue para a lista VIP.
  const { data: existente } = await supabase
    .from(CPF_TABELA_MEMBROS)
    .select("id")
    .in("cpf", variacoes)
    .limit(1);

  const jaEraMembro = Boolean(existente && existente.length > 0);

  if (!jaEraMembro) {
    const { error: erroMembro } = await supabase.from(CPF_TABELA_MEMBROS).insert({
      nome_completo: dados.nome,
      email: dados.email,
      cpf: formatarCpf(cpfDigits),
      whatsapp: maskPhone(dados.telefone),
      cep: dados.cep,
      data_nascimento: brDateToISO(dados.data_nascimento),
      sexo: dados.sexo,
      data_de_cadastro:
        new Date()
          .toLocaleString("sv-SE", { timeZone: "America/Sao_Paulo" })
          .replace(" ", "T") + "-03:00",
    });

    // 23505 = já existe. Não é motivo para barrar a entrada na lista VIP.
    if (erroMembro && erroMembro.code !== "23505") {
      console.error("[lista-vip/novo-membro] Erro ao criar membro:", erroMembro);
      return NextResponse.json(
        { error: "Não foi possível concluir o cadastro. Tente novamente." },
        { status: 500 }
      );
    }
  }

  // Só convida para o grupo quem de fato acabou de entrar na comunidade: quem
  // já era membro está nos grupos desde antes.
  const grupo = jaEraMembro ? null : await proximoGrupo(supabase);

  const resultado = await gravarLead(supabase, {
    nome: dados.nome,
    email: dados.email,
    telefone: onlyDigits(dados.telefone),
    cpfDigits,
    origem: "novo-membro",
    grupoWhatsapp: grupo,
    ...lerUtms(payload),
  });

  if (!resultado.ok) {
    return NextResponse.json({ error: resultado.error }, { status: resultado.status });
  }

  return NextResponse.json({
    ok: true,
    codigo: resultado.codigo,
    novoMembro: !jaEraMembro,
    grupo,
  });
}
