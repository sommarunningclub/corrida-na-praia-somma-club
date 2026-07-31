/* Peças comuns dos e-mails.
 *
 * Os templates são montados em tabelas com estilo inline: é o que Gmail,
 * Outlook e Apple Mail entendem igual. Nada de flex, grid, SVG ou <style>
 * externo. Tudo que mais de um e-mail usa mora aqui, para os disparos não
 * divergirem de paleta ou de forma de botão com o tempo.
 */

export const LARANJA = "#FF2C03";
export const NAVY = "#01053F";
export const NAVY_CLARO = "#010775";
export const AMARELO = "#FCAD00";
export const CREME = "#FEF5E6";
export const TINTA = "#0A0A0A";
export const CINZA = "#5A5A5A";
export const CINZA_CLARO = "#8A8A8A";

/** Base pública das imagens. O e-mail vive fora do site, então precisa de URL
 *  absoluta: caminho relativo não resolve na caixa de entrada. */
export function baseUrl(): string {
  return (
    process.env.NEXT_PUBLIC_SITE_URL ||
    "https://corrida-na-praia-somma-club.vercel.app"
  );
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

/** Bloco de seção com título colorido, para o corpo claro do e-mail. */
export function secao(rotulo: string, titulo: string, conteudo: string): string {
  return `
  <tr><td style="padding:34px 28px 0;">
    <p style="margin:0 0 6px;color:${LARANJA};font-size:11px;font-weight:700;letter-spacing:.16em;text-transform:uppercase;">${rotulo}</p>
    <h2 style="margin:0 0 16px;color:${TINTA};font-size:22px;line-height:1.25;font-weight:700;letter-spacing:-.4px;">${titulo}</h2>
    ${conteudo}
  </td></tr>`;
}

/** Item de lista com bolinha laranja, em tabela para o Outlook não quebrar. */
export function itemLista(texto: string, cor = LARANJA): string {
  return `
  <tr>
    <td width="22" valign="top" style="padding:5px 0 0;">
      <div style="width:7px;height:7px;border-radius:7px;background:${cor};"></div>
    </td>
    <td valign="top" style="padding:0 0 10px;color:${CINZA};font-size:15px;line-height:23px;">${texto}</td>
  </tr>`;
}

/** Botão pill. Usa tabela porque Outlook ignora padding em <a>. */
export function botao(
  href: string,
  texto: string,
  fundo = LARANJA,
  cor = "#ffffff"
): string {
  return `
  <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
    <tr><td bgcolor="${fundo}" style="border-radius:9999px;">
      <a href="${href}" style="display:inline-block;padding:15px 30px;color:${cor};text-decoration:none;font-size:15px;font-weight:700;">${texto}</a>
    </td></tr>
  </table>`;
}
