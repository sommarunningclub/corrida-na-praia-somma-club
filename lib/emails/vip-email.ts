import "server-only";
import { Resend } from "resend";
import {
  AGENDA,
  CRONOGRAMA,
  DUAS_EXPERIENCIAS,
  EVENTO,
  INCLUI,
  LISTA_VIP,
  PERCURSO,
  PRIORIDADE,
  R2,
  SOMMA,
  SORTEIO,
} from "@/lib/napraia-data";
import { firstName } from "@/lib/validation";

interface SendVipArgs {
  nome: string;
  email: string;
}

/** Envia o e-mail de confirmação da Lista VIP.
 *  Retorna o id do Resend (para gravar no lead) ou null se falhar. */
export async function sendVipEmail({ nome, email }: SendVipArgs): Promise<string | null> {
  // Chave de liga/desliga: com o envio desligado o cadastro responde na hora,
  // sem esperar a ida ao Resend. Para religar, defina VIP_EMAIL_ENABLED=true.
  if (process.env.VIP_EMAIL_ENABLED !== "true") {
    return null;
  }

  const apiKey = process.env.RESEND_API_KEY;
  const from = process.env.VIP_EMAIL_FROM;

  if (!apiKey || !from) {
    console.error("[vip-email] RESEND_API_KEY ou VIP_EMAIL_FROM não configurados.");
    return null;
  }

  try {
    const resend = new Resend(apiKey);
    const { data, error } = await resend.emails.send({
      from,
      to: email,
      subject: `${firstName(nome)}, você está na lista VIP da Corrida na Praia`,
      html: renderVipEmail({ nome }),
      text: renderVipEmailText({ nome }),
    });

    if (error) {
      console.error("[vip-email] Falha ao enviar:", error);
      return null;
    }
    return data?.id ?? null;
  } catch (err) {
    console.error("[vip-email] Erro inesperado:", err);
    return null;
  }
}

/* ─── Paleta e helpers ─────────────────────────────────────────────────────
 * O template é montado em tabelas com estilo inline: é o que Gmail, Outlook
 * e Apple Mail entendem igual. Nada de flex, grid, SVG ou <style> externo.
 */

const LARANJA = "#FF2C03";
const NAVY = "#01053F";
const NAVY_CLARO = "#010775";
const AMARELO = "#FCAD00";
const CREME = "#FEF5E6";
const TINTA = "#0A0A0A";
const CINZA = "#5A5A5A";
const CINZA_CLARO = "#8A8A8A";

/** Base pública das imagens. O e-mail vive fora do site, então precisa de URL
 *  absoluta: caminho relativo não resolve na caixa de entrada. */
function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://corrida-na-praia-somma-club.vercel.app"
  );
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Bloco de seção com título colorido, para o corpo claro do e-mail. */
function secao(rotulo: string, titulo: string, conteudo: string): string {
  return `
  <tr><td style="padding:34px 28px 0;">
    <p style="margin:0 0 6px;color:${LARANJA};font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">${rotulo}</p>
    <h2 style="margin:0 0 16px;color:${TINTA};font-size:22px;line-height:1.25;font-weight:700;letter-spacing:-.4px;">${titulo}</h2>
    ${conteudo}
  </td></tr>`;
}

/** Item de lista com bolinha laranja, em tabela para o Outlook não quebrar. */
function itemLista(texto: string, cor = LARANJA): string {
  return `
  <tr>
    <td width="22" valign="top" style="padding:5px 0 0;">
      <div style="width:7px;height:7px;border-radius:7px;background:${cor};"></div>
    </td>
    <td valign="top" style="padding:0 0 10px;color:${CINZA};font-size:15px;line-height:23px;">${texto}</td>
  </tr>`;
}

/** Botão pill. Usa tabela porque Outlook ignora padding em <a>. */
function botao(href: string, texto: string, fundo = LARANJA, cor = "#ffffff"): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr><td bgcolor="${fundo}" style="border-radius:9999px;">
      <a href="${href}" style="display:inline-block;padding:15px 30px;color:${cor};text-decoration:none;font-size:15px;font-weight:700;">${texto}</a>
    </td></tr>
  </table>`;
}

/* ─── Template ─────────────────────────────────────────────────────────── */

export function renderVipEmail({ nome }: { nome: string }): string {
  const primeiro = escapeHtml(firstName(nome));
  const { local } = EVENTO;
  const base = baseUrl();

  const inclui = INCLUI.map((i) => itemLista(escapeHtml(i))).join("");

  const cortesiaDa = DUAS_EXPERIENCIAS.cortesiaInclui
    .map((i) => itemLista(escapeHtml(i)))
    .join("");

  const cortesiaNao = DUAS_EXPERIENCIAS.cortesiaNaoInclui
    .map(
      (i) => `
  <tr>
    <td width="22" valign="top" style="padding:4px 0 0;color:${CINZA_CLARO};font-size:15px;line-height:20px;">&times;</td>
    <td valign="top" style="padding:0 0 10px;color:${CINZA_CLARO};font-size:15px;line-height:23px;">${escapeHtml(i)}</td>
  </tr>`
    )
    .join("");

  const etapasVenda = PRIORIDADE.etapas
    .map(
      (e) => `
  <tr><td style="padding:0 0 12px;">
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
           style="background:${e.destaque ? "rgba(255,44,3,.06)" : "#F6F6F6"};border:1px solid ${e.destaque ? "rgba(255,44,3,.25)" : "rgba(0,0,0,.07)"};border-radius:14px;">
      <tr>
        <td width="52" valign="top" style="padding:18px 0 18px 18px;">
          <table role="presentation" cellpadding="0" cellspacing="0">
            <tr><td width="34" height="34" align="center" valign="middle"
                    bgcolor="${e.destaque ? LARANJA : "#FFFFFF"}"
                    style="border-radius:34px;border:1px solid ${e.destaque ? LARANJA : "rgba(0,0,0,.1)"};color:${e.destaque ? "#ffffff" : TINTA};font-size:13px;font-weight:700;">
              ${e.ordem}
            </td></tr>
          </table>
        </td>
        <td valign="top" style="padding:18px 18px 18px 12px;">
          <p style="margin:0 0 4px;color:${TINTA};font-size:16px;font-weight:700;line-height:1.3;">${escapeHtml(e.titulo)}</p>
          <p style="margin:0;color:${CINZA};font-size:14px;line-height:21px;">${escapeHtml(e.descricao)}</p>
          ${e.destaque ? `<p style="margin:10px 0 0;"><span style="display:inline-block;background:${LARANJA};color:#fff;font-size:10px;font-weight:700;letter-spacing:.12em;text-transform:uppercase;padding:5px 10px;border-radius:9999px;">Você primeiro</span></p>` : ""}
        </td>
      </tr>
    </table>
  </td></tr>`
    )
    .join("");

  const trajeto = PERCURSO.trechos
    .map(
      (t, i) => `
  <tr>
    <td width="34" valign="top" style="padding:0 0 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td width="26" height="26" align="center" valign="middle"
                bgcolor="${i === 0 || i === PERCURSO.trechos.length - 1 ? LARANJA : "#FFFFFF"}"
                style="border-radius:26px;border:1px solid ${i === 0 || i === PERCURSO.trechos.length - 1 ? LARANJA : "rgba(0,0,0,.12)"};color:${i === 0 || i === PERCURSO.trechos.length - 1 ? "#ffffff" : TINTA};font-size:11px;font-weight:700;">${t.ordem}</td></tr>
      </table>
    </td>
    <td valign="top" style="padding:2px 0 12px;">
      <p style="margin:0 0 2px;color:${TINTA};font-size:15px;font-weight:600;line-height:1.3;">${escapeHtml(t.titulo)}</p>
      <p style="margin:0;color:${CINZA};font-size:14px;line-height:20px;">${escapeHtml(t.descricao)}</p>
    </td>
  </tr>`
    )
    .join("");

  const programacao = CRONOGRAMA.map(
    (c, i) => `
  <tr>
    <td width="34" valign="top" style="padding:0 0 12px;">
      <table role="presentation" cellpadding="0" cellspacing="0">
        <tr><td width="26" height="26" align="center" valign="middle"
                bgcolor="${c.destaque ? LARANJA : "#FFFFFF"}"
                style="border-radius:26px;border:1px solid ${c.destaque ? LARANJA : "rgba(0,0,0,.12)"};color:${c.destaque ? "#ffffff" : TINTA};font-size:11px;font-weight:700;">${String(i + 1).padStart(2, "0")}</td></tr>
      </table>
    </td>
    <td valign="top" style="padding:2px 0 12px;">
      <p style="margin:0 0 2px;color:${TINTA};font-size:15px;font-weight:600;line-height:1.3;">${escapeHtml(c.titulo)}</p>
      <p style="margin:0;color:${CINZA};font-size:14px;line-height:20px;">${escapeHtml(c.descricao)}</p>
    </td>
  </tr>`
  ).join("");

  const infoRapida = [
    ["Data", EVENTO.dataExtenso],
    ["Distância", `${EVENTO.distancia}, circuito único`],
    ["Local", `${local.nome}, ${local.bairro}`],
    ["Day use", `Até às ${EVENTO.dayUseAte}`],
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

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="color-scheme" content="light">
<meta name="supported-color-schemes" content="light">
<title>Você está na lista VIP da Corrida na Praia</title>
<style>
  /* No celular o lockup das marcas fica centralizado; no desktop segue
     à esquerda. inline-table + text-align no pai é o jeito que Gmail,
     Apple Mail e Outlook mobile respeitam de forma consistente. */
  @media only screen and (max-width: 600px) {
    .lockup-wrap { text-align: center !important; }
    .lockup { display: inline-table !important; float: none !important; }
  }
</style>
</head>
<body style="margin:0;padding:0;background:#EDEDF2;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;">

  <!-- Prévia que aparece na lista de e-mails -->
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">
    Corrida de ${EVENTO.distancia} no ${local.nome}, ${EVENTO.dataCurta}. Você compra antes do público geral.
  </div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#EDEDF2;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
             style="max-width:600px;background:#ffffff;border-radius:22px;overflow:hidden;">

        <!-- ─── Cabeçalho: as duas marcas ─── -->
        <tr><td class="lockup-wrap" bgcolor="${NAVY}" style="padding:26px 28px;">
          <!-- As duas marcas juntas, como um lockup só: à esquerda no
               desktop, centralizado no celular (ver media query). -->
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
              Lista VIP confirmada
            </span>
          </p>
          <h1 style="margin:0 0 10px;color:#ffffff;font-size:34px;line-height:1.1;font-weight:700;letter-spacing:-1px;">
            Boa, ${primeiro}!
          </h1>
          <p style="margin:0 0 4px;color:${AMARELO};font-size:15px;font-weight:700;letter-spacing:.04em;">
            ${EVENTO.nome.toUpperCase()}
          </p>
          <p style="margin:0;color:rgba(255,255,255,.75);font-size:16px;line-height:24px;">
            ${EVENTO.dataExtenso}
          </p>
        </td></tr>

        <!-- ─── Confirmação ─── -->
        <tr><td style="padding:32px 28px 0;">
          <p style="margin:0;color:${CINZA};font-size:16px;line-height:26px;">
            Seu cadastro na lista VIP está confirmado. As vagas são limitadas e você
            será avisado por e-mail, Grupos do WhatsApp Somma e pelas redes sociais
            oficiais do Somma Club assim que as vendas abrirem, antes do público
            geral. <strong style="color:${TINTA};">Fica ligado e não dá mole.</strong>
          </p>
        </td></tr>

        <!-- ─── Cartão de informações ─── -->
        <tr><td style="padding:22px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:${CREME};border-radius:16px;">
            ${infoRapida}
          </table>
        </td></tr>

        <!-- ─── Sorteio ─── -->
        <tr><td style="padding:16px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0"
                 style="background:${AMARELO};border-radius:16px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 6px;color:rgba(1,5,63,.65);font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">
                Você também está concorrendo
              </p>
              <p style="margin:0 0 6px;color:${NAVY};font-size:18px;line-height:24px;font-weight:700;">
                ${SORTEIO.atracoes}
              </p>
              <p style="margin:0 0 3px;color:rgba(1,5,63,.7);font-size:13px;line-height:19px;">
                Show · ${SORTEIO.showDia} · ${SORTEIO.hora} · ${SORTEIO.local}
              </p>
              <p style="margin:0;color:${NAVY};font-size:13px;font-weight:700;">
                Sorteio · ${SORTEIO.sorteioDia}
              </p>
            </td></tr>
          </table>
        </td></tr>

        <!-- ─── Como funciona a venda ─── -->
        ${secao(
          PRIORIDADE.eyebrow,
          PRIORIDADE.titulo,
          `<p style="margin:0 0 16px;color:${CINZA};font-size:15px;line-height:23px;">${escapeHtml(PRIORIDADE.descricao)}</p>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${etapasVenda}</table>
           <p style="margin:6px 0 0;color:${CINZA_CLARO};font-size:13px;line-height:20px;">${escapeHtml(PRIORIDADE.aviso)}</p>`
        )}

        <!-- ─── O que está incluído ─── -->
        ${secao(
          "O QUE O INGRESSO INCLUI",
          "Tudo isso em uma inscrição",
          `<table role="presentation" width="100%" cellpadding="0" cellspacing="0">${inclui}</table>`
        )}

        <!-- ─── Cortesia ─── -->
        ${secao(
          "SOBRE A CORTESIA",
          DUAS_EXPERIENCIAS.cortesiaTitulo,
          `<p style="margin:0 0 16px;color:${CINZA};font-size:15px;line-height:23px;">${escapeHtml(DUAS_EXPERIENCIAS.nota)}</p>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F6;border-radius:14px;">
             <tr><td style="padding:18px;">
               <p style="margin:0 0 10px;color:${LARANJA};font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Dá direito a</p>
               <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cortesiaDa}</table>
               <p style="margin:14px 0 10px;color:${CINZA_CLARO};font-size:10px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Não dá direito a</p>
               <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${cortesiaNao}</table>
             </td></tr>
           </table>`
        )}

        <!-- ─── Percurso ─── -->
        ${secao(
          PERCURSO.eyebrow,
          PERCURSO.titulo,
          `<p style="margin:0 0 16px;color:${CINZA};font-size:15px;line-height:23px;">${escapeHtml(PERCURSO.paragrafos[1])}</p>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${trajeto}</table>`
        )}

        <!-- ─── O dia ─── -->
        ${secao(
          "O DIA DO EVENTO",
          "Como vai ser o domingo",
          `<p style="margin:0 0 16px;color:${CINZA};font-size:15px;line-height:23px;">
             Da chegada ao after, tudo dentro do ${escapeHtml(local.nome)}.
           </p>
           <table role="presentation" width="100%" cellpadding="0" cellspacing="0">${programacao}</table>
           <p style="margin:6px 0 0;color:${CINZA_CLARO};font-size:13px;line-height:20px;">
             Os horários de abertura dos portões e da largada ainda serão confirmados
             pela organização.
           </p>`
        )}

        <!-- ─── Ações ─── -->
        <tr><td style="padding:32px 28px 0;text-align:center;">
          ${botao(local.maps, "Ver o local no mapa")}
          <p style="margin:12px 0 0;">
            <a href="${AGENDA.pagina}" style="display:inline-block;padding:14px 28px;border:1px solid rgba(0,0,0,.14);border-radius:9999px;color:${TINTA};text-decoration:none;font-size:15px;font-weight:600;">
              Adicionar à minha agenda
            </a>
          </p>
        </td></tr>

        <!-- ─── Aviso legal ─── -->
        <tr><td style="padding:28px 28px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#F6F6F6;border-radius:14px;">
            <tr><td style="padding:16px 18px;">
              <p style="margin:0;color:${CINZA_CLARO};font-size:12px;line-height:19px;">
                ${escapeHtml(LISTA_VIP.aviso)} ${escapeHtml(SORTEIO.regra)}
              </p>
            </td></tr>
          </table>
        </td></tr>

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
                Somma Club · CNPJ ${SOMMA.cnpj}<br>
                Você recebeu este e-mail porque se cadastrou na lista VIP da ${EVENTO.nome}.
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

export function renderVipEmailText({ nome }: { nome: string }): string {
  const { local } = EVENTO;
  const linha = (t: string) => `- ${t}`;

  return [
    `Boa, ${firstName(nome)}!`,
    "",
    "Seu cadastro na lista VIP está confirmado. As vagas são limitadas e você será",
    "avisado por e-mail, Grupos do WhatsApp Somma e pelas redes sociais oficiais do",
    "Somma Club assim que as vendas abrirem, antes do público geral.",
    "Fica ligado e não dá mole.",
    "",
    "== A CORRIDA ==",
    `Data: ${EVENTO.dataExtenso}`,
    `Distância: ${EVENTO.distancia}, circuito único`,
    `Local: ${local.nome}, ${local.endereco}, ${local.bairro}`,
    `Day use: até às ${EVENTO.dayUseAte}`,
    "",
    "== VOCÊ TAMBÉM ESTÁ CONCORRENDO ==",
    `${SORTEIO.atracoes}`,
    `Show: ${SORTEIO.showDia}, ${SORTEIO.hora}, ${SORTEIO.local}`,
    `Sorteio: ${SORTEIO.sorteioDia}`,
    "",
    `== ${PRIORIDADE.titulo.toUpperCase()} ==`,
    PRIORIDADE.descricao,
    ...PRIORIDADE.etapas.map((e) => `${e.ordem}. ${e.titulo}: ${e.descricao}`),
    PRIORIDADE.aviso,
    "",
    "== O QUE O INGRESSO INCLUI ==",
    ...INCLUI.map(linha),
    "",
    "== SOBRE A CORTESIA ==",
    DUAS_EXPERIENCIAS.nota,
    "Dá direito a:",
    ...DUAS_EXPERIENCIAS.cortesiaInclui.map(linha),
    "Não dá direito a:",
    ...DUAS_EXPERIENCIAS.cortesiaNaoInclui.map(linha),
    "",
    "== O PERCURSO ==",
    PERCURSO.paragrafos[1],
    ...PERCURSO.trechos.map((t) => `${t.ordem}. ${t.titulo}: ${t.descricao}`),
    "",
    "== COMO VAI SER O DOMINGO ==",
    ...CRONOGRAMA.map((c, i) => `${String(i + 1).padStart(2, "0")}. ${c.titulo}: ${c.descricao}`),
    "Os horários de abertura dos portões e da largada ainda serão confirmados pela organização.",
    "",
    `Mapa: ${local.maps}`,
    `Agenda: ${AGENDA.pagina}`,
    "",
    LISTA_VIP.aviso,
    SORTEIO.regra,
    "",
    `Dúvidas? Responda a este e-mail ou chame no WhatsApp: ${SOMMA.links.whatsapp}`,
    `Instagram: ${SOMMA.links.instagram}`,
    `Somma Club · CNPJ ${SOMMA.cnpj}`,
    `Você recebeu este e-mail porque se cadastrou na lista VIP da ${EVENTO.nome}.`,
  ].join("\n");
}
