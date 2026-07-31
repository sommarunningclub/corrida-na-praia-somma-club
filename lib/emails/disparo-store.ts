import "server-only";
import { Resend } from "resend";
import { getServiceSupabase, LISTA_VIP_TABLE } from "@/lib/supabase";
import { baseUrl } from "@/lib/emails/base";
import { tokenDescadastro, urlDescadastro } from "@/lib/descadastro";
import {
  assuntoCorreEmail,
  renderCorreEmail,
  renderCorreEmailText,
  type Onda,
} from "@/lib/emails/corre-email";

/**
 * Disparo em massa das ondas do Corre para a base da lista VIP.
 *
 * O envio é agendado no próprio Resend (`scheduled_at`), não por cron daqui:
 * uma vez aceito, o e-mail sai no horário mesmo que nada nosso esteja de pé.
 *
 * Três proteções, porque um disparo em massa não tem desfazer:
 *   1. quem se descadastrou nunca entra na lista;
 *   2. índice único (lead_id, campanha) no banco: rodar a mesma onda duas
 *      vezes não manda o e-mail duas vezes para ninguém;
 *   3. modo teste, que monta tudo e não chama o Resend.
 */

export const DISPAROS_TABLE = "napraia_disparos";

/** Nome da onda no banco. Muda a cada campanha; as três de hoje seguem este
 *  padrão para o painel conseguir agrupar. */
export function campanhaDaOnda(onda: Onda): string {
  return `corre-01-08-onda-${onda}`;
}

export type AlvoDisparo = {
  id: string;
  nome: string;
  email: string;
};

export type FiltroDisparo = "todos" | "nao-clicou";

export type ResultadoDisparo = {
  campanha: string;
  agendadoPara: string | null;
  elegiveis: number;
  enviados: number;
  jaTinham: number;
  descadastrados: number;
  falhas: number;
  erros: string[];
  teste: boolean;
};

/**
 * Quem recebe a onda.
 *
 * `nao-clicou` remove quem já clicou em alguma onda anterior desta campanha:
 * quem confirmou presença não precisa ser lembrado de novo. O clique vem de
 * `email_status`, então rode a sincronização de status antes de disparar,
 * senão o filtro trabalha com dados velhos.
 */
export async function alvosDaOnda(filtro: FiltroDisparo): Promise<{
  alvos: AlvoDisparo[];
  descadastrados: number;
}> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const { data, error } = await supabase
    .from(LISTA_VIP_TABLE)
    .select("id, nome, email, descadastrado_em")
    .order("created_at", { ascending: true });

  if (error) throw new Error(`Falha ao ler a base: ${error.message}`);

  const linhas = (data ?? []) as Array<AlvoDisparo & { descadastrado_em: string | null }>;
  const ativos = linhas.filter((l) => !l.descadastrado_em);
  const descadastrados = linhas.length - ativos.length;

  if (filtro === "todos") {
    return { alvos: ativos.map(({ id, nome, email }) => ({ id, nome, email })), descadastrados };
  }

  const { data: cliques, error: erroCliques } = await supabase
    .from(DISPAROS_TABLE)
    .select("lead_id, email_status")
    .like("campanha", "corre-01-08-%")
    .eq("email_status", "clicked");

  if (erroCliques) throw new Error(`Falha ao ler os disparos: ${erroCliques.message}`);

  const clicaram = new Set((cliques ?? []).map((c) => c.lead_id as string));

  return {
    alvos: ativos
      .filter((l) => !clicaram.has(l.id))
      .map(({ id, nome, email }) => ({ id, nome, email })),
    descadastrados,
  };
}

/**
 * Agenda (ou envia na hora, com `quando` nulo) uma onda inteira.
 *
 * @param quando  ISO 8601 do horário de envio, ou null para sair já.
 * @param teste   Monta tudo, grava nada e não chama o Resend.
 */
export async function dispararOnda({
  onda,
  filtro,
  quando,
  teste = false,
}: {
  onda: Onda;
  filtro: FiltroDisparo;
  quando: string | null;
  teste?: boolean;
}): Promise<ResultadoDisparo> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VIP_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.");
  }

  const campanha = campanhaDaOnda(onda);
  const { alvos, descadastrados } = await alvosDaOnda(filtro);

  // Quem já tem linha nesta campanha fica de fora: é a trava contra o disparo
  // repetido, conferida antes de gastar chamada de API.
  const { data: jaFeitos, error: erroJa } = await supabase
    .from(DISPAROS_TABLE)
    .select("lead_id")
    .eq("campanha", campanha);

  if (erroJa) throw new Error(`Falha ao conferir a campanha: ${erroJa.message}`);

  const feitos = new Set((jaFeitos ?? []).map((d) => d.lead_id as string));
  const pendentes = alvos.filter((a) => !feitos.has(a.id));

  const resultado: ResultadoDisparo = {
    campanha,
    agendadoPara: quando,
    elegiveis: alvos.length,
    enviados: 0,
    jaTinham: alvos.length - pendentes.length,
    descadastrados,
    falhas: 0,
    erros: [],
    teste,
  };

  if (teste || pendentes.length === 0) return resultado;

  const resend = new Resend(apiKey);
  const base = baseUrl();

  // O Resend aceita até 100 e-mails por chamada de lote.
  for (let i = 0; i < pendentes.length; i += 100) {
    const lote = pendentes.slice(i, i + 100);

    const mensagens = lote.map((alvo) => {
      const token = tokenDescadastro(alvo.id);
      const saida = urlDescadastro(base, alvo.id);
      const umClique = `${base}/api/descadastro?t=${encodeURIComponent(token)}`;
      return {
        from,
        to: alvo.email,
        subject: assuntoCorreEmail(alvo.nome, onda),
        html: renderCorreEmail({ nome: alvo.nome, onda, descadastroUrl: saida }),
        text: renderCorreEmailText({ nome: alvo.nome, onda, descadastroUrl: saida }),
        ...(quando ? { scheduledAt: quando } : {}),
        // Descadastro em um clique dentro da própria caixa de entrada. O
        // Gmail cobra isso de quem envia em volume e conta pontos de
        // reputação por ter.
        headers: {
          "List-Unsubscribe": `<${umClique}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      };
    });

    const { data, error } = await resend.batch.send(mensagens);

    if (error) {
      resultado.falhas += lote.length;
      resultado.erros.push(error.message);
      continue;
    }

    // A resposta do lote vem na mesma ordem em que os e-mails foram enviados.
    const ids = (data?.data ?? []) as Array<{ id: string }>;
    const linhas = lote.map((alvo, j) => ({
      lead_id: alvo.id,
      campanha,
      resend_email_id: ids[j]?.id ?? null,
      email_status: quando ? "scheduled" : "sent",
      agendado_para: quando,
    }));

    const { error: erroInsert } = await supabase.from(DISPAROS_TABLE).insert(linhas);

    if (erroInsert) {
      // O e-mail já foi aceito pelo Resend: sem a linha no banco perdemos o
      // rastro, mas o disparo aconteceu. Registrar alto para não passar batido.
      resultado.erros.push(`Envio aceito, gravação falhou: ${erroInsert.message}`);
    }

    resultado.enviados += lote.length;
  }

  return resultado;
}

/**
 * Manda uma onda para um endereço só, sem tocar na base nem no histórico.
 * É o ensaio antes do disparo: serve para ver na caixa de entrada como o
 * e-mail chega de verdade, com assunto, imagens e link de saída.
 */
export async function enviarAmostra({
  onda,
  para,
  nome,
}: {
  onda: Onda;
  para: string;
  nome: string;
}): Promise<{ id: string | null }> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VIP_EMAIL_FROM;
  if (!apiKey || !from) {
    throw new Error("RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.");
  }

  const base = baseUrl();
  // Token de um id que não existe: o link abre a página e o descadastro
  // recusa, então um teste nunca tira alguém real da lista.
  const saida = urlDescadastro(base, "amostra-sem-cadastro");

  const resend = new Resend(apiKey);
  const { data, error } = await resend.emails.send({
    from,
    to: para,
    subject: `[TESTE] ${assuntoCorreEmail(nome, onda)}`,
    html: renderCorreEmail({ nome, onda, descadastroUrl: saida }),
    text: renderCorreEmailText({ nome, onda, descadastroUrl: saida }),
  });

  if (error) throw new Error(error.message);
  return { id: data?.id ?? null };
}

/** Cancela os e-mails agendados de uma onda que ainda não saíram. */
export async function cancelarOnda(onda: Onda): Promise<{ cancelados: number; falhas: number }> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const campanha = campanhaDaOnda(onda);
  const { data, error } = await supabase
    .from(DISPAROS_TABLE)
    .select("id, resend_email_id")
    .eq("campanha", campanha)
    .eq("email_status", "scheduled");

  if (error) throw new Error(`Falha ao ler a campanha: ${error.message}`);

  const resend = new Resend(apiKey);
  let cancelados = 0;
  let falhas = 0;

  for (const linha of data ?? []) {
    if (!linha.resend_email_id) continue;
    try {
      const { error: erroCancel } = await resend.emails.cancel(linha.resend_email_id as string);
      if (erroCancel) {
        falhas += 1;
        continue;
      }
      await supabase
        .from(DISPAROS_TABLE)
        .update({ email_status: "canceled" })
        .eq("id", linha.id);
      cancelados += 1;
    } catch {
      falhas += 1;
    }
  }

  return { cancelados, falhas };
}
