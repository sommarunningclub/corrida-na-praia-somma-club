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

/**
 * Horário combinado de cada onda, em Brasília.
 *
 * É a fonte única: o agendamento em massa e a entrada automática de quem se
 * cadastra durante o dia leem daqui. Mudou o horário de uma onda? Mude aqui e
 * reagende com `reagendarOnda`, senão o banco e o Resend discordam.
 */
export const AGENDA_ONDAS: Record<Onda, string> = {
  1: "2026-07-31T14:15:00-03:00",
  2: "2026-07-31T17:30:00-03:00",
  3: "2026-07-31T22:00:00-03:00",
};

/** Margem para não agendar em cima da hora: o Resend recusa horário passado
 *  e o relógio do servidor pode estar alguns segundos à frente. */
const MARGEM_MS = 2 * 60 * 1000;

/** Nome da onda no banco. Muda a cada campanha; as três de hoje seguem este
 *  padrão para o painel conseguir agrupar. */
export function campanhaDaOnda(onda: Onda): string {
  return `corre-01-08-onda-${onda}`;
}

/**
 * O Supabase corta a resposta em mil linhas e não avisa. Em disparo isso é
 * grave: a base cresce e um dia metade dela simplesmente deixaria de receber,
 * sem erro nenhum aparecendo. Toda leitura de lista aqui passa por esta
 * paginação.
 */
const PAGINA = 1000;

async function lerTudo<T>(
  consulta: (de: number, ate: number) => PromiseLike<{ data: T[] | null; error: { message: string } | null }>,
  oQue: string
): Promise<T[]> {
  const tudo: T[] = [];
  for (let de = 0; ; de += PAGINA) {
    const { data, error } = await consulta(de, de + PAGINA - 1);
    if (error) throw new Error(`Falha ao ler ${oQue}: ${error.message}`);
    const lote = data ?? [];
    tudo.push(...lote);
    if (lote.length < PAGINA) return tudo;
  }
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

  const linhas = await lerTudo<AlvoDisparo & { descadastrado_em: string | null }>(
    (de, ate) =>
      supabase
        .from(LISTA_VIP_TABLE)
        .select("id, nome, email, descadastrado_em")
        .order("created_at", { ascending: true })
        .range(de, ate),
    "a base"
  );
  const ativos = linhas.filter((l) => !l.descadastrado_em);
  const descadastrados = linhas.length - ativos.length;

  if (filtro === "todos") {
    return { alvos: ativos.map(({ id, nome, email }) => ({ id, nome, email })), descadastrados };
  }

  const cliques = await lerTudo<{ lead_id: string }>(
    (de, ate) =>
      supabase
        .from(DISPAROS_TABLE)
        .select("lead_id")
        .like("campanha", "corre-01-08-%")
        .eq("email_status", "clicked")
        .range(de, ate),
    "os cliques"
  );

  const clicaram = new Set(cliques.map((c) => c.lead_id));

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
  const jaFeitos = await lerTudo<{ lead_id: string }>(
    (de, ate) =>
      supabase.from(DISPAROS_TABLE).select("lead_id").eq("campanha", campanha).range(de, ate),
    "a campanha"
  );

  const feitos = new Set(jaFeitos.map((d) => d.lead_id));
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
 * Coloca quem acabou de se cadastrar nas ondas que ainda não saíram.
 *
 * Chamada no fluxo de cadastro, não por cron: quem entra na lista às 16h
 * pega a onda das 17h30 e a das 22h; quem entra às 20h pega só a das 22h;
 * quem entra depois da última não recebe nada, e está certo assim.
 *
 * Nunca derruba o cadastro: falhar aqui significa não receber uma campanha,
 * o que é bem menos grave do que perder o lead.
 */
export async function agendarOndasFuturas(lead: AlvoDisparo): Promise<Onda[]> {
  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VIP_EMAIL_FROM;
  const supabase = getServiceSupabase();
  if (!apiKey || !from || !supabase) return [];

  const agora = Date.now();
  const futuras = ([1, 2, 3] as Onda[]).filter(
    (o) => new Date(AGENDA_ONDAS[o]).getTime() > agora + MARGEM_MS
  );
  if (futuras.length === 0) return [];

  const resend = new Resend(apiKey);
  const base = baseUrl();
  const token = tokenDescadastro(lead.id);
  const saida = urlDescadastro(base, lead.id);
  const umClique = `${base}/api/descadastro?t=${encodeURIComponent(token)}`;
  const entraram: Onda[] = [];

  for (const onda of futuras) {
    try {
      const { data, error } = await resend.emails.send({
        from,
        to: lead.email,
        subject: assuntoCorreEmail(lead.nome, onda),
        html: renderCorreEmail({ nome: lead.nome, onda, descadastroUrl: saida }),
        text: renderCorreEmailText({ nome: lead.nome, onda, descadastroUrl: saida }),
        scheduledAt: AGENDA_ONDAS[onda],
        headers: {
          "List-Unsubscribe": `<${umClique}>`,
          "List-Unsubscribe-Post": "List-Unsubscribe=One-Click",
        },
      });

      if (error || !data) {
        console.error(`[disparo] Onda ${onda} recusada para ${lead.email}:`, error);
        continue;
      }

      // O índice único (lead_id, campanha) protege contra a linha dupla se
      // esta função rodar duas vezes para o mesmo cadastro.
      const { error: erroInsert } = await supabase.from(DISPAROS_TABLE).insert({
        lead_id: lead.id,
        campanha: campanhaDaOnda(onda),
        resend_email_id: data.id,
        email_status: "scheduled",
        agendado_para: AGENDA_ONDAS[onda],
      });

      if (erroInsert) {
        console.error(`[disparo] Onda ${onda} enviada sem registro:`, erroInsert.message);
      }
      entraram.push(onda);
    } catch (err) {
      console.error(`[disparo] Falha inesperada na onda ${onda}:`, err);
    }
  }

  return entraram;
}

/**
 * Muda o horário de uma onda que ainda não saiu, no Resend e no banco.
 *
 * Reagendar e não cancelar/recriar: cancelamento no Resend não tem volta, e
 * a trava de disparo duplicado impediria montar a onda de novo sem antes
 * apagar o histórico.
 */
export async function reagendarOnda(
  onda: Onda,
  quando: string
): Promise<{ reagendados: number; falhas: number }> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  if (new Date(quando).getTime() < Date.now() + MARGEM_MS) {
    throw new Error("Esse horário já passou ou está muito próximo.");
  }

  const campanha = campanhaDaOnda(onda);
  const linhas = await lerTudo<{ id: string; resend_email_id: string }>(
    (de, ate) =>
      supabase
        .from(DISPAROS_TABLE)
        .select("id, resend_email_id")
        .eq("campanha", campanha)
        .eq("email_status", "scheduled")
        .not("resend_email_id", "is", null)
        .range(de, ate),
    "a onda"
  );

  const resend = new Resend(apiKey);
  let reagendados = 0;
  let falhas = 0;

  // Duas por vez, com respiro: o Resend aceita 2 requisições por segundo.
  for (let i = 0; i < linhas.length; i += 2) {
    await Promise.all(
      linhas.slice(i, i + 2).map(async (linha) => {
        try {
          const { error } = await resend.emails.update({
            id: linha.resend_email_id,
            scheduledAt: quando,
          });
          if (error) {
            falhas += 1;
            return;
          }
          await supabase
            .from(DISPAROS_TABLE)
            .update({ agendado_para: quando })
            .eq("id", linha.id);
          reagendados += 1;
        } catch {
          falhas += 1;
        }
      })
    );
    if (i + 2 < linhas.length) await new Promise((s) => setTimeout(s, 550));
  }

  return { reagendados, falhas };
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

export type ResumoOnda = {
  onda: Onda;
  campanha: string;
  /** Rótulo curto do papel da onda, para a tela não virar "onda 1, 2, 3". */
  papel: string;
  total: number;
  agendados: number;
  entregues: number;
  abertos: number;
  cliques: number;
  cancelados: number;
  problemas: number;
  /** Horário de envio combinado com o Resend. */
  agendadoPara: string | null;
};

const PAPEL_DA_ONDA: Record<Onda, string> = {
  1: "O convite",
  2: "O corre",
  3: "Última chamada",
};

/**
 * Uma linha por onda para o painel: quanto foi, quanto chegou, quanto voltou.
 *
 * Conta no servidor, com `head: true`, em vez de trazer as linhas e somar
 * aqui. Não é otimização: o Supabase devolve no máximo mil linhas por
 * consulta e a campanha inteira passa disso, então somar no cliente daria
 * número errado justo na última onda.
 */
export async function resumoCampanha(): Promise<ResumoOnda[]> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const contar = async (campanha: string, status?: string[]): Promise<number> => {
    let q = supabase
      .from(DISPAROS_TABLE)
      .select("id", { count: "exact", head: true })
      .eq("campanha", campanha);
    if (status) q = q.in("email_status", status);

    const { count, error } = await q;
    if (error) throw new Error(`Falha ao contar os disparos: ${error.message}`);
    return count ?? 0;
  };

  return Promise.all(
    ([1, 2, 3] as Onda[]).map(async (onda) => {
      const campanha = campanhaDaOnda(onda);

      const [total, agendados, entregues, abertos, cliques, cancelados, problemas] =
        await Promise.all([
          contar(campanha),
          contar(campanha, ["scheduled"]),
          // Abertura e clique implicam entrega; contam nos dois lugares.
          contar(campanha, ["delivered", "opened", "clicked"]),
          contar(campanha, ["opened", "clicked"]),
          contar(campanha, ["clicked"]),
          contar(campanha, ["canceled"]),
          contar(campanha, ["bounced", "complained", "suppressed", "failed"]),
        ]);

      const { data: quando } = await supabase
        .from(DISPAROS_TABLE)
        .select("agendado_para")
        .eq("campanha", campanha)
        .not("agendado_para", "is", null)
        .limit(1);

      return {
        onda,
        campanha,
        papel: PAPEL_DA_ONDA[onda],
        total,
        agendados,
        entregues,
        abertos,
        cliques,
        cancelados,
        problemas,
        agendadoPara: quando?.[0]?.agendado_para ?? null,
      };
    })
  );
}

/**
 * Atualiza no banco o último evento de cada disparo de uma campanha.
 *
 * O Resend aceita 2 requisições por segundo, então isto anda em duplas com
 * respiro: uma onda de 500 leva uns quatro minutos. Rode antes da poda, senão
 * ela decide com dados velhos.
 */
export async function sincronizarDisparos(campanha: string): Promise<{
  consultados: number;
  atualizados: number;
  falhas: number;
}> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const linhas = await lerTudo<{
    id: string;
    resend_email_id: string;
    email_status: string | null;
  }>(
    (de, ate) =>
      supabase
        .from(DISPAROS_TABLE)
        .select("id, resend_email_id, email_status")
        .eq("campanha", campanha)
        .not("resend_email_id", "is", null)
        .range(de, ate),
    "a campanha"
  );

  const resend = new Resend(apiKey);
  const r = { consultados: linhas.length, atualizados: 0, falhas: 0 };

  for (let i = 0; i < linhas.length; i += 2) {
    await Promise.all(
      linhas.slice(i, i + 2).map(async (linha) => {
        try {
          const { data: email, error: erro } = await resend.emails.get(
            linha.resend_email_id as string
          );
          if (erro || !email) {
            r.falhas += 1;
            return;
          }
          const evento = (email as { last_event?: string }).last_event ?? "sent";
          if (evento === linha.email_status) return;

          const { error: erroUpdate } = await supabase
            .from(DISPAROS_TABLE)
            .update({ email_status: evento })
            .eq("id", linha.id);

          if (erroUpdate) r.falhas += 1;
          else r.atualizados += 1;
        } catch {
          r.falhas += 1;
        }
      })
    );
    if (i + 2 < linhas.length) await new Promise((s) => setTimeout(s, 550));
  }

  return r;
}

/**
 * Tira da onda agendada quem já clicou em uma onda anterior.
 *
 * O filtro `nao-clicou` do agendamento só enxerga o que aconteceu até o
 * momento em que a onda foi agendada. Como as três saem no mesmo dia, a
 * segmentação real acontece aqui: pouco antes do horário, cancela no Resend
 * o e-mail de quem já confirmou presença. Quem clicou não é lembrado de novo.
 */
export async function podarOnda(onda: Onda): Promise<{
  clicaram: number;
  cancelados: number;
  falhas: number;
}> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) throw new Error("RESEND_API_KEY não configurada.");

  const campanha = campanhaDaOnda(onda);

  const { data: cliques, error: erroCliques } = await supabase
    .from(DISPAROS_TABLE)
    .select("lead_id")
    .like("campanha", "corre-01-08-%")
    .neq("campanha", campanha)
    .eq("email_status", "clicked");

  if (erroCliques) throw new Error(`Falha ao ler os cliques: ${erroCliques.message}`);

  const clicaram = new Set((cliques ?? []).map((c) => c.lead_id as string));
  if (clicaram.size === 0) return { clicaram: 0, cancelados: 0, falhas: 0 };

  const { data: agendados, error: erroAgendados } = await supabase
    .from(DISPAROS_TABLE)
    .select("id, lead_id, resend_email_id")
    .eq("campanha", campanha)
    .eq("email_status", "scheduled");

  if (erroAgendados) throw new Error(`Falha ao ler a onda: ${erroAgendados.message}`);

  const resend = new Resend(apiKey);
  let cancelados = 0;
  let falhas = 0;

  for (const linha of agendados ?? []) {
    if (!clicaram.has(linha.lead_id as string) || !linha.resend_email_id) continue;
    try {
      const { error: erro } = await resend.emails.cancel(linha.resend_email_id as string);
      if (erro) {
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

  return { clicaram: clicaram.size, cancelados, falhas };
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
