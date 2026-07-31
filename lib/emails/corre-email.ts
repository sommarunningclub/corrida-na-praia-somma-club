import "server-only";
import { CORRE, EVENTO, R2, SOMMA, SORTEIO } from "@/lib/napraia-data";
import { firstName } from "@/lib/validation";
import {
  AMARELO,
  baseUrl,
  botao,
  CINZA,
  CINZA_CLARO,
  CREME,
  escapeHtml,
  LARANJA,
  NAVY,
  NAVY_CLARO,
  TINTA,
} from "@/lib/emails/base";

/* Campanha da lista VIP para o Corre do Somma Club de sábado.
 *
 * São três e-mails no mesmo dia, e três e-mails no mesmo dia só se justificam
 * se cada um tiver trabalho próprio. O destino é sempre o mesmo (estar no
 * corre às 7h), mas o argumento muda:
 *
 *   1 · 13h    o convite    tem um ingresso sendo entregue lá, em mãos
 *   2 · 17h30  o corre      mesmo sem ingresso vale ir, tem pelotão pro seu ritmo
 *   3 · 20h30  a virada     o resultado saiu, e quem está presente segue no jogo
 *
 * Cada onda monta blocos diferentes, na ordem que serve ao seu argumento.
 * Quem receber as três lê uma história avançando, não o mesmo e-mail três
 * vezes.
 */

export type Onda = 1 | 2 | 3;

type Bloco =
  | "regra" // cartão amarelo: se o ganhador não aparecer, sorteio na hora
  | "texto" // parágrafo de abertura da onda
  | "pelotoes" // os três ritmos do check-in
  | "cta" // botão de confirmar presença
  | "encontro" // cartão creme com quando, onde e o que rola
  | "etapas" // linha do tempo do sorteio, em três momentos
  | "comunidade" // por que o corre vale por si só
  | "aviso"; // regra formal da entrega presencial

type Cabeca = {
  selo: string;
  titulo: (primeiro: string) => string;
  texto: string;
  assunto: string;
  preheader: string;
  /** Chamada do botão. Muda de tom conforme a hora do dia. */
  cta: string;
  blocos: Bloco[];
};

const ONDAS: Record<Onda, Cabeca> = {
  // O convite. Apresenta a oportunidade inteira: o que está em jogo, como o
  // ingresso chega, e o que fazer para participar.
  1: {
    selo: "É amanhã",
    titulo: (p) => `${p}, tem corre amanhã e tem ingresso em jogo`,
    texto:
      "O resultado do sorteio sai hoje até às 21h30. Independente do nome que sair, amanhã cedo o encontro é o mesmo: 7h no Estacionamento 10 do Parque da Cidade, com a galera do Somma Club. <strong>Confirme sua presença e apareça.</strong>",
    assunto: "o ingresso do show é entregue amanhã no corre",
    preheader:
      "Sábado, 7h, Estacionamento 10 do Parque da Cidade. Quem estiver lá pode sair com o ingresso do show.",
    cta: "Confirmar minha presença",
    blocos: ["regra", "texto", "pelotoes", "cta", "encontro", "etapas", "aviso"],
  },

  // O corre. Aqui o sorteio sai do centro: o argumento é o treino em si, para
  // quem leu o primeiro e-mail e pensou "não vou ganhar mesmo".
  2: {
    selo: "Amanhã, 7h",
    titulo: (p) => `${p}, tem pelotão pro seu ritmo amanhã`,
    texto:
      "Sábado de manhã no Parque da Cidade, com quem gosta de correr. Não precisa ter pace, não precisa ter experiência: são três pelotões e você escolhe o seu no check-in. <strong>Ninguém corre sozinho e ninguém fica para trás.</strong>",
    assunto: "amanhã tem corre e tem pelotão pro seu ritmo",
    preheader:
      "Três pelotões, do iniciante ao avançado. Sábado, 7h, Estacionamento 10 do Parque da Cidade.",
    cta: "Escolher meu pelotão",
    blocos: ["texto", "pelotoes", "cta", "encontro", "comunidade", "regra", "aviso"],
  },

  // A virada. Curto e de véspera: o resultado saiu, o relógio corre, e a
  // presença é o que decide. Sem linha do tempo, sem pelotão: só o essencial.
  3: {
    selo: "Última chamada",
    titulo: (p) => `${p}, é amanhã às 7h. Quem está lá continua no jogo`,
    texto:
      "O nome do ganhador é divulgado até às 21h30 de hoje. Amanhã, a entrega é presencial no corre, e se o sorteado não estiver lá o ingresso é sorteado de novo, na hora, entre quem apareceu. <strong>Coloque o despertador para as 6h.</strong>",
    assunto: "última chamada: amanhã, 7h, no Parque da Cidade",
    preheader:
      "O ingresso é entregue em mãos no corre. Quem não estiver lá fica de fora do sorteio da hora.",
    cta: "Confirmar minha presença",
    blocos: ["texto", "regra", "cta", "encontro", "aviso"],
  },
};

/** Assunto do disparo. Fica junto do template para os dois andarem no mesmo
 *  tom: mudou a copy da onda, o assunto muda ao lado. */
export function assuntoCorreEmail(nome: string, onda: Onda = 1): string {
  return `${firstName(nome)}, ${ONDAS[onda].assunto}`;
}

export function renderCorreEmail({
  nome,
  onda = 1,
  descadastroUrl = null,
}: {
  nome: string;
  onda?: Onda;
  /** Link assinado de saída da lista. Nulo só na prévia do template. */
  descadastroUrl?: string | null;
}): string {
  const primeiro = escapeHtml(firstName(nome));
  const base = baseUrl();
  const cabeca = ONDAS[onda];

  /* ─── Peças ─────────────────────────────────────────────────────────────
   * Cada uma devolve uma linha da tabela externa, para as ondas montarem a
   * sequência que quiserem sem quebrar o layout.
   */

  const regra = `
        <tr><td style="padding:28px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:${AMARELO};border-radius:16px;">
            <tr><td style="padding:22px;">
              <p style="margin:0 0 7px;color:rgba(1,5,63,.65);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">
                Por que vale aparecer
              </p>
              <p style="margin:0 0 10px;color:${NAVY};font-size:20px;line-height:26px;font-weight:700;letter-spacing:-.3px;">
                Se o ganhador não estiver lá, o sorteio é refeito na hora
              </p>
              <p style="margin:0;color:rgba(1,5,63,.78);font-size:15px;line-height:23px;">
                O ingresso só é entregue em mãos, no ${CORRE.nome}. Se o nome sorteado
                não estiver presente, fazemos um novo sorteio ali mesmo, entre os
                participantes da lista VIP que estiverem no local. Ou seja: quem
                aparece continua no jogo.
              </p>
            </td></tr>
          </table>
        </td></tr>`;

  const texto = `
        <tr><td style="padding:26px 28px 0;">
          <p style="margin:0;color:${CINZA};font-size:16px;line-height:26px;">
            ${cabeca.texto.replace(/<strong>/g, `<strong style="color:${TINTA};">`)}
          </p>
        </td></tr>`;

  // Bolinha colorida + nome, no mesmo código de cor do passo 2 do check-in.
  const linhasPelotao = CORRE.pelotoes
    .map(
      (p) => `
  <tr>
    <td width="26" valign="top" style="padding:6px 0 0;">
      <div style="width:10px;height:10px;border-radius:10px;background:${p.cor};"></div>
    </td>
    <td valign="top" style="padding:0 0 12px;">
      <p style="margin:0 0 1px;color:${TINTA};font-size:15px;font-weight:700;line-height:21px;">${escapeHtml(p.nome)}</p>
      <p style="margin:0;color:${CINZA};font-size:14px;line-height:20px;">${escapeHtml(p.descricao)}</p>
    </td>
  </tr>`
    )
    .join("");

  const pelotoes = `
        <tr><td style="padding:24px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:#F6F6F6;border-radius:16px;">
            <tr><td style="padding:20px 18px;">
              <p style="margin:0 0 4px;color:${LARANJA};font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">
                No check-in você escolhe
              </p>
              <p style="margin:0 0 6px;color:${TINTA};font-size:18px;line-height:24px;font-weight:700;letter-spacing:-.2px;">
                Tem pelotão para cada ritmo
              </p>
              <p style="margin:0 0 16px;color:${CINZA};font-size:14px;line-height:21px;">
                Ninguém corre sozinho e ninguém fica para trás. Escolha o seu na hora de
                confirmar presença.
              </p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${linhasPelotao}</table>
            </td></tr>
          </table>
        </td></tr>`;

  const cta = `
        <tr><td style="padding:24px 28px 0;text-align:center;">
          ${botao(CORRE.checkin, cabeca.cta)}
          <p style="margin:12px 0 0;">
            <a href="${CORRE.maps}" style="display:inline-block;padding:14px 28px;border:1px solid rgba(0,0,0,.14);border-radius:9999px;color:${TINTA};text-decoration:none;font-size:15px;font-weight:600;">
              Ver o ponto de encontro
            </a>
          </p>
        </td></tr>`;

  const linhasEncontro = [
    ["Quando", `${CORRE.dia}, ${CORRE.hora}`],
    ["Onde", `${CORRE.local}, ${CORRE.cidade}`],
    ["O que rola", "Corre da comunidade e a entrega do ingresso do show"],
  ]
    .map(
      ([r, v], i, arr) => `
  <tr>
    <td style="padding:13px 18px;${i < arr.length - 1 ? "border-bottom:1px solid rgba(0,0,0,.07);" : ""}">
      <p style="margin:0 0 3px;color:${LARANJA};font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">${r}</p>
      <p style="margin:0;color:${TINTA};font-size:15px;font-weight:600;line-height:20px;">${escapeHtml(v)}</p>
    </td>
  </tr>`
    )
    .join("");

  const encontro = `
        <tr><td style="padding:24px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:${CREME};border-radius:16px;">
            ${linhasEncontro}
          </table>
        </td></tr>`;

  const linhasEtapa = SORTEIO.etapas
    .map(
      (e) => `
  <tr><td style="padding:0 0 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${e.destaque ? "rgba(255,44,3,.06)" : "#F6F6F6"};border:1px solid ${e.destaque ? "rgba(255,44,3,.25)" : "rgba(0,0,0,.07)"};border-radius:14px;">
      <tr><td style="padding:16px 18px;">
        <p style="margin:0 0 5px;color:${e.destaque ? LARANJA : CINZA_CLARO};font-size:10px;font-weight:700;letter-spacing:.13em;text-transform:uppercase;">${escapeHtml(e.selo)}</p>
        <p style="margin:0 0 4px;color:${TINTA};font-size:16px;font-weight:700;line-height:1.3;">${escapeHtml(e.titulo)}</p>
        <p style="margin:0;color:${CINZA};font-size:14px;line-height:21px;">${escapeHtml(e.descricao)}</p>
      </td></tr>
    </table>
  </td></tr>`
    )
    .join("");

  const etapas = `
        <tr><td style="padding:34px 28px 0;">
          <p style="margin:0 0 6px;color:${LARANJA};font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">${SORTEIO.eyebrow}</p>
          <h2 style="margin:0 0 16px;color:${TINTA};font-size:22px;line-height:1.25;font-weight:700;letter-spacing:-.4px;">Como o ingresso chega até você</h2>
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${linhasEtapa}</table>
        </td></tr>`;

  // Só na onda 2: o motivo de ir que não depende de sorteio nenhum.
  const comunidade = `
        <tr><td style="padding:30px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:${NAVY};border-radius:16px;">
            <tr><td style="padding:24px;">
              <p style="margin:0 0 6px;color:${AMARELO};font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">
                ${SOMMA.nome}
              </p>
              <p style="margin:0 0 10px;color:#ffffff;font-size:19px;line-height:25px;font-weight:700;letter-spacing:-.2px;">
                ${SOMMA.slogan}
              </p>
              <p style="margin:0;color:rgba(255,255,255,.65);font-size:15px;line-height:23px;">
                O corre de sábado é aberto e é de graça. Vai gente que corre há anos e
                gente que começou semana passada. Você chega, escolhe o pelotão e corre
                junto. O ingresso do show é o extra do dia, não o motivo.
              </p>
            </td></tr>
          </table>
        </td></tr>`;

  const aviso = `
        <tr><td style="padding:20px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F6;border-left:3px solid ${NAVY};border-radius:14px;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0 0 6px;color:${NAVY};font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Importante</p>
              <p style="margin:0 0 8px;color:${CINZA};font-size:14px;line-height:22px;">
                ${escapeHtml(SORTEIO.avisoPresenca)}
              </p>
              <p style="margin:0;color:${CINZA_CLARO};font-size:12px;line-height:19px;">
                ${escapeHtml(SORTEIO.regra)}
              </p>
            </td></tr>
          </table>
        </td></tr>`;

  const PECAS: Record<Bloco, string> = {
    regra,
    texto,
    pelotoes,
    cta,
    encontro,
    etapas,
    comunidade,
    aviso,
  };

  const corpo = cabeca.blocos.map((b) => PECAS[b]).join("\n");

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>${escapeHtml(cabeca.titulo("Você"))}</title>
<style>
  @media only screen and (max-width: 600px) {
    .lockup-wrap { text-align: center !important; }
    .lockup { display: inline-table !important; float: none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#EDEDF2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Prévia que aparece na lista de e-mails -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    ${cabeca.preheader}
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEDF2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;">

        <!-- ─── Cabeçalho: as duas marcas ─── -->
        <tr><td class="lockup-wrap" bgcolor="${NAVY}" style="padding:26px 28px;">
          <table class="lockup" role="presentation" cellpadding="0" cellspacing="0">
            <tr>
              <td valign="middle">
                <img src="${base}/email/logo-somma.png" width="132" alt="${SOMMA.nome}" style="display:block;border:0;">
              </td>
              <td valign="middle" style="color:rgba(255,255,255,.35);font-size:17px;padding:0 14px;">&amp;</td>
              <td valign="middle">
                <img src="${base}/email/logo-r2.png" width="68" alt="${R2.nome}" style="display:block;border:0;">
              </td>
            </tr>
          </table>
        </td></tr>

        <!-- ─── Hero ─── -->
        <tr><td bgcolor="${NAVY_CLARO}" style="padding:38px 28px 34px;text-align:center;">
          <p style="margin:0 0 14px;">
            <span style="display:inline-block;background:${LARANJA};color:#fff;font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;padding:7px 14px;border-radius:9999px;">
              ${cabeca.selo}
            </span>
          </p>
          <h1 style="margin:0 0 12px;color:#ffffff;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:-1px;">
            ${cabeca.titulo(primeiro)}
          </h1>
          <p style="margin:0 0 6px;color:${AMARELO};font-size:15px;font-weight:700;letter-spacing:.04em;">
            ${onda === 2 ? "CORRE DO SOMMA CLUB" : SORTEIO.atracoes.toUpperCase()}
          </p>
          <p style="margin:0;color:rgba(255,255,255,.75);font-size:16px;line-height:24px;">
            ${CORRE.dia}, ${CORRE.hora}<br>${CORRE.local}
          </p>
        </td></tr>

${corpo}

        <!-- ─── Rodapé ─── -->
        <tr><td bgcolor="${NAVY}" style="padding:30px 28px;margin-top:28px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
            <tr><td align="center" style="padding-bottom:18px;">
              <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;"><tr>
                <td><img src="${base}/email/logo-somma.png" width="112" alt="${SOMMA.nome}" style="display:block;border:0;"></td>
                <td style="color:rgba(255,255,255,.3);font-size:15px;padding:0 12px;">&amp;</td>
                <td><img src="${base}/email/logo-r2.png" width="58" alt="${R2.nome}" style="display:block;border:0;"></td>
              </tr></table>
            </td></tr>

            <tr><td align="center" style="padding-bottom:16px;">
              <p style="margin:0;color:rgba(255,255,255,.5);font-size:13px;line-height:21px;">
                Dúvidas? Responda a este e-mail ou chame no
                <a href="${SOMMA.links.whatsapp}" style="color:${AMARELO};text-decoration:none;font-weight:600;">WhatsApp</a>.
              </p>
            </td></tr>

            <tr><td align="center" style="padding-bottom:16px;">
              <a href="${SOMMA.links.instagram}" style="color:rgba(255,255,255,.6);text-decoration:none;font-size:13px;padding:0 8px;">Instagram</a>
              <span style="color:rgba(255,255,255,.2);">·</span>
              <a href="${SOMMA.links.strava}" style="color:rgba(255,255,255,.6);text-decoration:none;font-size:13px;padding:0 8px;">Strava</a>
              <span style="color:rgba(255,255,255,.2);">·</span>
              <a href="${SOMMA.links.site}" style="color:rgba(255,255,255,.6);text-decoration:none;font-size:13px;padding:0 8px;">sommaclub.com.br</a>
            </td></tr>

            <tr><td align="center">
              <p style="margin:0;color:rgba(255,255,255,.3);font-size:11px;line-height:18px;">
                ${SOMMA.nome} · CNPJ ${SOMMA.cnpj}<br>
                Você recebeu este e-mail porque se cadastrou na lista VIP da ${EVENTO.nome}.
                ${
                  descadastroUrl
                    ? `<br><a href="${descadastroUrl}" style="color:rgba(255,255,255,.55);text-decoration:underline;">Não quero mais receber estes e-mails</a>`
                    : ""
                }
              </p>
            </td></tr>
          </table>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export function renderCorreEmailText({
  nome,
  onda = 1,
  descadastroUrl = null,
}: {
  nome: string;
  onda?: Onda;
  descadastroUrl?: string | null;
}): string {
  const cabeca = ONDAS[onda];
  const semTags = (s: string) => s.replace(/<\/?strong>/g, "");

  const PECAS: Record<Bloco, string[]> = {
    // A redação aqui é a do cartão amarelo, não a do aviso formal: as duas
    // peças convivem no mesmo e-mail e não podem sair repetidas.
    regra: [
      "== POR QUE VALE APARECER ==",
      "Se o ganhador não estiver lá, o sorteio é refeito na hora.",
      `O ingresso só é entregue em mãos, no ${CORRE.nome}. Se o nome sorteado não`,
      "estiver presente, fazemos um novo sorteio ali mesmo, entre os participantes",
      "da lista VIP que estiverem no local. Ou seja: quem aparece continua no jogo.",
      "",
    ],
    texto: [semTags(cabeca.texto), ""],
    pelotoes: [
      "== NO CHECK-IN VOCÊ ESCOLHE SEU PELOTÃO ==",
      "Ninguém corre sozinho e ninguém fica para trás.",
      ...CORRE.pelotoes.map((p) => `- ${p.nome}: ${p.descricao}`),
      "",
    ],
    cta: [
      `${cabeca.cta}: ${CORRE.checkin}`,
      `Ponto de encontro no mapa: ${CORRE.maps}`,
      "",
    ],
    encontro: [
      "== O ENCONTRO ==",
      `Quando: ${CORRE.dia}, ${CORRE.hora}`,
      `Onde: ${CORRE.local}, ${CORRE.cidade}`,
      "O que rola: corre da comunidade e a entrega do ingresso do show",
      "",
    ],
    etapas: [
      `== ${SORTEIO.eyebrow} ==`,
      ...SORTEIO.etapas.flatMap((e) => [e.selo, `${e.titulo}: ${e.descricao}`, ""]),
    ],
    comunidade: [
      `== ${SOMMA.nome.toUpperCase()} ==`,
      SOMMA.slogan,
      "O corre de sábado é aberto e é de graça. Vai gente que corre há anos e gente",
      "que começou semana passada. Você chega, escolhe o pelotão e corre junto.",
      "O ingresso do show é o extra do dia, não o motivo.",
      "",
    ],
    aviso: ["== IMPORTANTE ==", SORTEIO.avisoPresenca, SORTEIO.regra, ""],
  };

  return [
    `${cabeca.titulo(firstName(nome))}.`,
    "",
    `${CORRE.dia}, ${CORRE.hora}`,
    `${CORRE.local}, ${CORRE.cidade}`,
    "",
    ...cabeca.blocos.flatMap((b) => PECAS[b]),
    `Dúvidas? Responda a este e-mail ou chame no WhatsApp: ${SOMMA.links.whatsapp}`,
    `Instagram: ${SOMMA.links.instagram}`,
    `${SOMMA.nome} · CNPJ ${SOMMA.cnpj}`,
    `Você recebeu este e-mail porque se cadastrou na lista VIP da ${EVENTO.nome}.`,
    ...(descadastroUrl ? [`Não quero mais receber estes e-mails: ${descadastroUrl}`] : []),
  ].join("\n");
}
