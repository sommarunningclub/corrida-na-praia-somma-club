import { NextResponse } from "next/server";
import { renderVipEmail, renderVipEmailText } from "@/lib/emails/vip-email";
import { GRUPOS_WHATSAPP, urlDoGrupo } from "@/lib/napraia-data";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Prévia do e-mail da lista VIP, para revisar o template sem disparar envio.
 *
 * Fora de desenvolvimento exige `?token=` igual ao ADMIN_PREVIEW_TOKEN. Sem a
 * variável definida, a rota simplesmente não existe em produção: melhor 404 do
 * que deixar o template aberto para qualquer um.
 *
 *   /api/email-preview             → HTML renderizado
 *   /api/email-preview?formato=txt → versão texto puro
 *   /api/email-preview?nome=Ana    → troca o nome usado no exemplo
 *   /api/email-preview?grupo=0     → sem o convite ao grupo (quem já era membro)
 */
export async function GET(request: Request) {
  const url = new URL(request.url);

  if (process.env.NODE_ENV === "production") {
    const esperado = process.env.ADMIN_PREVIEW_TOKEN;
    if (!esperado || url.searchParams.get("token") !== esperado) {
      return new NextResponse("Not found", { status: 404 });
    }
  }

  const nome = url.searchParams.get("nome")?.slice(0, 60) || "Ana Beatriz Souza";

  // O caso interessante de revisar é o do novo membro, então a prévia mostra o
  // convite por padrão. `?grupo=0` mostra o e-mail de quem já era da comunidade.
  const grupoParam = url.searchParams.get("grupo");
  const grupoUrl =
    grupoParam === "0" ? null : urlDoGrupo(Number(grupoParam) || GRUPOS_WHATSAPP[0].numero);

  if (url.searchParams.get("formato") === "txt") {
    return new NextResponse(renderVipEmailText({ nome, grupoUrl }), {
      headers: { "Content-Type": "text/plain; charset=utf-8" },
    });
  }

  return new NextResponse(renderVipEmail({ nome, grupoUrl }), {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}
