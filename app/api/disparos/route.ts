import { NextResponse } from "next/server";
import { timingSafeEqual } from "crypto";
import type { Onda } from "@/lib/emails/corre-email";
import {
  campanhaDaOnda,
  cancelarOnda,
  dispararOnda,
  enviarAmostra,
  podarOnda,
  reagendarOnda,
  sincronizarDisparos,
  type FiltroDisparo,
} from "@/lib/emails/disparo-store";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";
// Um lote de 100 leva alguns segundos; a base inteira pode passar disso.
export const maxDuration = 300;

/**
 * Operação das ondas de e-mail. Só POST, sempre com o código de editor.
 *
 *   { "acao": "agendar", "onda": 1, "filtro": "todos",
 *     "quando": "2026-07-31T13:00:00-03:00", "teste": true }
 *
 *   { "acao": "cancelar", "onda": 3 }
 *
 * `teste: true` conta os alvos e não chama o Resend. Use antes de cada
 * disparo de verdade: é a única forma de ver o tamanho da lista sem enviar.
 */
export async function POST(request: Request) {
  const codigo = process.env.ADMIN_ACCESS_CODE;
  if (!codigo) {
    return NextResponse.json({ error: "Painel sem código configurado." }, { status: 503 });
  }

  const enviado = request.headers.get("x-admin-codigo") ?? "";
  const a = Buffer.from(enviado);
  const b = Buffer.from(codigo);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return NextResponse.json({ error: "Não autorizado." }, { status: 401 });
  }

  let corpo: {
    acao?: string;
    onda?: number;
    filtro?: string;
    quando?: string | null;
    teste?: boolean;
    para?: string;
    nome?: string;
  };

  try {
    corpo = await request.json();
  } catch {
    return NextResponse.json({ error: "Corpo inválido." }, { status: 400 });
  }

  const onda = corpo.onda;
  if (onda !== 1 && onda !== 2 && onda !== 3) {
    return NextResponse.json({ error: "Onda precisa ser 1, 2 ou 3." }, { status: 400 });
  }

  if (corpo.acao === "amostra") {
    const para = String(corpo.para ?? "").trim();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(para)) {
      return NextResponse.json({ error: "Informe um e-mail válido em 'para'." }, { status: 400 });
    }
    try {
      const r = await enviarAmostra({
        onda: onda as Onda,
        para,
        nome: String(corpo.nome ?? "Alex").trim() || "Alex",
      });
      return NextResponse.json({ ok: true, ...r });
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  if (corpo.acao === "reagendar") {
    try {
      const quando = String(corpo.quando ?? "");
      if (!quando || Number.isNaN(new Date(quando).getTime())) {
        return NextResponse.json({ error: "Informe 'quando' em ISO 8601." }, { status: 400 });
      }
      return NextResponse.json(await reagendarOnda(onda as Onda, quando));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  if (corpo.acao === "sincronizar") {
    try {
      return NextResponse.json(await sincronizarDisparos(campanhaDaOnda(onda as Onda)));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  if (corpo.acao === "podar") {
    try {
      return NextResponse.json(await podarOnda(onda as Onda));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  if (corpo.acao === "cancelar") {
    try {
      return NextResponse.json(await cancelarOnda(onda as Onda));
    } catch (err) {
      return NextResponse.json({ error: (err as Error).message }, { status: 500 });
    }
  }

  if (corpo.acao !== "agendar") {
    return NextResponse.json({ error: "Ação deve ser 'agendar' ou 'cancelar'." }, { status: 400 });
  }

  const filtro = corpo.filtro === "nao-clicou" ? "nao-clicou" : "todos";

  // Agendar para o passado faria o Resend soltar tudo na hora, sem aviso.
  const quando = corpo.quando ?? null;
  if (quando) {
    const alvo = new Date(quando);
    if (Number.isNaN(alvo.getTime())) {
      return NextResponse.json({ error: "Data inválida." }, { status: 400 });
    }
    if (alvo.getTime() < Date.now() - 60_000) {
      return NextResponse.json(
        { error: "Esse horário já passou. Confira a data antes de agendar." },
        { status: 400 }
      );
    }
  }

  try {
    const r = await dispararOnda({
      onda: onda as Onda,
      filtro: filtro as FiltroDisparo,
      quando,
      teste: corpo.teste === true,
    });
    return NextResponse.json(r);
  } catch (err) {
    return NextResponse.json({ error: (err as Error).message }, { status: 500 });
  }
}
