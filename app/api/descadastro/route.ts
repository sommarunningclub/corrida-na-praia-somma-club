import { NextResponse } from "next/server";
import { descadastrar } from "@/lib/descadastro";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

/**
 * Descadastro em um clique, o que o Gmail e o Yahoo esperam de quem envia em
 * volume: o cliente de e-mail faz POST neste endereço a partir do header
 * List-Unsubscribe e a pessoa sai da lista sem abrir o navegador.
 *
 * Só POST. Em GET, os robôs que varrem links de e-mail tirariam gente da
 * lista sem ninguém ter clicado; quem chega por GET vai para a página de
 * confirmação.
 */
export async function POST(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  const r = await descadastrar(token);

  if (!r.ok) {
    return NextResponse.json({ ok: false, error: r.mensagem }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

export async function GET(request: Request) {
  const token = new URL(request.url).searchParams.get("t") ?? "";
  return NextResponse.redirect(
    new URL(`/descadastro?t=${encodeURIComponent(token)}`, request.url)
  );
}
