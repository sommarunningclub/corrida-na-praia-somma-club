import "server-only";
import { Resend } from "resend";
import { EVENTO, LISTA_VIP, SOMMA, SORTEIO } from "@/lib/napraia-data";
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

/* ─── Template ─────────────────────────────────────────────────────────── */

const ORANGE = "#FF2C03";
const NAVY = "#01053F";
const INK = "#0A0A0A";
const YELLOW = "#FCAD00";

export function renderVipEmail({ nome }: { nome: string }): string {
  const primeiro = firstName(nome);
  const { local } = EVENTO;

  return `<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Você está na lista VIP da Corrida na Praia</title>
</head>
<body style="margin:0;padding:0;background:#f5f5f5;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;">6 km no Na Praia Parque em 06 de setembro. Você terá acesso antecipado à pré-venda.</div>

  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#f5f5f5;padding:24px 12px;">
    <tr><td align="center">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="max-width:560px;background:#ffffff;border-radius:24px;overflow:hidden;box-shadow:0 1px 2px rgba(0,0,0,.05);">

        <!-- Header -->
        <tr><td style="background:${NAVY};padding:40px 32px;text-align:center;">
          <p style="margin:0 0 12px;color:${ORANGE};font-size:12px;font-weight:600;letter-spacing:.18em;text-transform:uppercase;">Lista VIP confirmada</p>
          <h1 style="margin:0;color:#ffffff;font-size:32px;line-height:1.1;font-weight:700;letter-spacing:-1px;">
            Corrida na Praia
          </h1>
          <p style="margin:10px 0 0;color:rgba(255,255,255,.55);font-size:14px;">Somma Club &amp; R2</p>
        </td></tr>

        <!-- Corpo -->
        <tr><td style="padding:36px 32px 8px;">
          <p style="margin:0 0 16px;color:${INK};font-size:18px;line-height:28px;font-weight:600;">Boa, ${escapeHtml(primeiro)}!</p>
          <p style="margin:0 0 24px;color:#525252;font-size:16px;line-height:26px;">
            Seu cadastro na lista VIP está confirmado. As vagas são limitadas e você
            será avisado por WhatsApp e e-mail assim que as vendas abrirem, antes
            do público geral.
          </p>
        </td></tr>

        <!-- Detalhes -->
        <tr><td style="padding:0 32px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="border:1px solid rgba(0,0,0,.1);border-radius:16px;">
            ${row("Quando", EVENTO.dataExtenso)}
            ${row("Onde", `${local.nome}, ${local.endereco}<br>${local.bairro}`)}
            ${row("Distância", `${EVENTO.distancia}, com largada e chegada dentro do parque`)}
            ${row("Day use", `Até às ${EVENTO.dayUseAte}`)}
            ${row("Vagas", "Limitadas · você será avisado na abertura", true)}
          </table>
        </td></tr>

        <!-- Sorteio -->
        <tr><td style="padding:24px 32px 0;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${YELLOW};border-radius:16px;">
            <tr><td style="padding:20px;">
              <p style="margin:0 0 6px;color:rgba(1,5,63,.7);font-size:11px;font-weight:700;letter-spacing:.14em;text-transform:uppercase;">Você também está concorrendo</p>
              <p style="margin:0 0 4px;color:${NAVY};font-size:17px;line-height:24px;font-weight:700;">${SORTEIO.atracoes}</p>
              <p style="margin:0;color:rgba(1,5,63,.65);font-size:13px;">${SORTEIO.data} · ${SORTEIO.hora} · ${SORTEIO.local}</p>
            </td></tr>
          </table>
        </td></tr>

        <!-- Incluso -->
        <tr><td style="padding:24px 32px 8px;">
          <p style="margin:0 0 12px;color:${INK};font-size:14px;font-weight:600;letter-spacing:.08em;text-transform:uppercase;">O ingresso inclui</p>
          <ul style="margin:0;padding-left:20px;color:#525252;font-size:15px;line-height:26px;">
            <li>Corrida de ${EVENTO.distancia} e kit oficial com camiseta, boné e meia</li>
            <li>Medalha, café da manhã e experiências de parceiros</li>
            <li>Day use no ${local.nome} até às ${EVENTO.dayUseAte} e after no parque</li>
            <li>Uma cortesia para levar um acompanhante</li>
          </ul>
        </td></tr>

        <!-- CTA -->
        <tr><td style="padding:24px 32px 8px;text-align:center;">
          <a href="${local.maps}" style="display:inline-block;background:${ORANGE};color:#ffffff;text-decoration:none;font-size:15px;font-weight:600;padding:14px 28px;border-radius:9999px;">
            Ver o local no mapa
          </a>
        </td></tr>

        <!-- Aviso -->
        <tr><td style="padding:20px 32px 0;">
          <p style="margin:0;color:#a3a3a3;font-size:12px;line-height:20px;">
            ${LISTA_VIP.aviso} Os horários de abertura dos portões e da largada ainda
            serão confirmados pela organização.
          </p>
        </td></tr>

        <!-- Rodapé -->
        <tr><td style="padding:28px 32px 32px;border-top:1px solid rgba(0,0,0,.08);margin-top:24px;">
          <p style="margin:0 0 12px;color:#737373;font-size:13px;line-height:22px;">
            Dúvidas? Responda a este e-mail ou chame no
            <a href="${SOMMA.links.whatsapp}" style="color:${ORANGE};text-decoration:none;">WhatsApp</a>.
          </p>
          <p style="margin:0;color:#a3a3a3;font-size:12px;line-height:20px;">
            Somma Club · CNPJ ${SOMMA.cnpj}<br>
            <a href="${SOMMA.links.instagram}" style="color:#737373;text-decoration:none;">Instagram</a> ·
            <a href="${SOMMA.links.strava}" style="color:#737373;text-decoration:none;">Strava</a> ·
            <a href="${SOMMA.links.site}" style="color:#737373;text-decoration:none;">sommaclub.com.br</a>
          </p>
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

function row(label: string, value: string, last = false): string {
  return `<tr>
    <td style="padding:16px 20px;${last ? "" : "border-bottom:1px solid rgba(0,0,0,.08);"}">
      <p style="margin:0 0 4px;color:${ORANGE};font-size:11px;font-weight:600;letter-spacing:.14em;text-transform:uppercase;">${label}</p>
      <p style="margin:0;color:${INK};font-size:16px;line-height:24px;font-weight:500;">${value}</p>
    </td>
  </tr>`;
}

export function renderVipEmailText({ nome }: { nome: string }): string {
  const { local } = EVENTO;
  return [
    `Boa, ${firstName(nome)}!`,
    "",
    "Seu cadastro na lista VIP da Corrida na Praia está confirmado.",
    "As vagas são limitadas e você será avisado por WhatsApp e e-mail assim que as vendas abrirem.",
    "",
    `Quando: ${EVENTO.dataExtenso}`,
    `Onde: ${local.nome}, ${local.endereco}, ${local.bairro}`,
    `Distância: ${EVENTO.distancia}, com largada e chegada dentro do parque`,
    `Day use: até às ${EVENTO.dayUseAte}`,
    "Vagas: limitadas · você será avisado na abertura",
    "",
    `Você também está concorrendo a um ingresso para ${SORTEIO.atracoes} (${SORTEIO.data}, ${SORTEIO.hora}, ${SORTEIO.local}).`,
    "",
    "O ingresso inclui:",
    `- Corrida de ${EVENTO.distancia} e kit oficial com camiseta, boné e meia`,
    "- Medalha, café da manhã e experiências de parceiros",
    `- Day use no ${local.nome} até às ${EVENTO.dayUseAte} e after no parque`,
    "- Uma cortesia para levar um acompanhante",
    "",
    `Mapa: ${local.maps}`,
    "",
    LISTA_VIP.aviso,
    "Os horários de abertura dos portões e da largada ainda serão confirmados pela organização.",
    "",
    `Dúvidas? Responda a este e-mail ou chame no WhatsApp: ${SOMMA.links.whatsapp}`,
    `Somma Club · CNPJ ${SOMMA.cnpj}`,
  ].join("\n");
}

function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}
