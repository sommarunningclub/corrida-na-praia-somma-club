import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Porta de entrada do /admin: um código de acesso único, compartilhado pela
 * equipe. Não é um sistema de usuários — é um cadeado para um painel interno
 * que lida com dados pessoais de 78 leads.
 *
 * O código nunca vira o cookie. O que fica no navegador é um token HMAC com
 * prazo, então roubar o cookie não revela o código nem vale para sempre.
 */

export const ADMIN_COOKIE = "napraia_admin";

const VALIDADE_MS = 12 * 60 * 60 * 1000; // 12h — uma jornada de trabalho

/**
 * O código combinado vive só no ambiente. Este repositório é público: um
 * valor padrão aqui dentro seria a senha do painel exposta no GitHub.
 * Sem a variável, ninguém entra — falha fechado, nunca aberto.
 */
function codigoEsperado(): string | null {
  const codigo = process.env.ADMIN_ACCESS_CODE;
  if (!codigo) {
    console.error(
      "[admin] ADMIN_ACCESS_CODE não configurada — o painel fica inacessível até definir a variável."
    );
    return null;
  }
  return codigo;
}

/** Sem literal de reserva: um segredo conhecido permitiria forjar o cookie. */
function segredo(): string {
  const s =
    process.env.ADMIN_SESSION_SECRET ||
    process.env.LISTA_VIP_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!s) throw new Error("[admin] Nenhum segredo disponível para assinar a sessão.");
  return s;
}

function assinar(payload: string): string {
  return createHmac("sha256", segredo()).update(payload).digest("base64url");
}

/** Comparação em tempo constante: não entrega o código por cronometragem. */
function iguais(a: string, b: string): boolean {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
}

export function codigoConfere(informado: string): boolean {
  const esperado = codigoEsperado();
  if (!esperado) return false;
  return iguais(informado.trim(), esperado);
}

export function criarSessao(): string {
  const payload = `admin.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${assinar(payload)}`;
}

export function sessaoValida(token: string | undefined): boolean {
  if (!token) return false;
  // Sem código configurado o painel está desligado: nem cookie antigo entra.
  if (!codigoEsperado()) return false;

  const partes = token.split(".");
  if (partes.length !== 2) return false;

  const [corpo, assinatura] = partes;
  let payload: string;
  try {
    payload = Buffer.from(corpo, "base64url").toString("utf8");
  } catch {
    return false;
  }

  if (!iguais(assinatura, assinar(payload))) return false;

  const [marca, emitidoEm] = payload.split(".");
  if (marca !== "admin" || !emitidoEm) return false;

  return Date.now() - Number(emitidoEm) <= VALIDADE_MS;
}

/** Lê o cookie da requisição atual. Use em Server Components e Server Actions. */
export async function estaAutenticado(): Promise<boolean> {
  const jar = await cookies();
  return sessaoValida(jar.get(ADMIN_COOKIE)?.value);
}

/** Barreira para as ações: qualquer mutação passa por aqui antes de tocar o banco. */
export async function exigirAdmin(): Promise<void> {
  if (!(await estaAutenticado())) {
    throw new Error("Sessão expirada. Entre novamente no painel.");
  }
}

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: VALIDADE_MS / 1000,
} as const;
