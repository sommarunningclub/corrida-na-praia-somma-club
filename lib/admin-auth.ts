import "server-only";
import { createHmac, timingSafeEqual } from "crypto";
import { cookies } from "next/headers";

/**
 * Porta de entrada do /admin. Dois códigos, dois papéis:
 *
 *   editor  — mexe em tudo (ADMIN_ACCESS_CODE)
 *   leitor  — só consulta; nada de criar, editar, excluir ou exportar
 *             (ADMIN_VIEW_CODE)
 *
 * Não é um sistema de usuários: é um cadeado de equipe para um painel com
 * dados pessoais. O código nunca vira o cookie — o que fica no navegador é um
 * HMAC com prazo, e o papel vai assinado dentro dele, então não dá para virar
 * editor mexendo no cookie.
 */

export const ADMIN_COOKIE = "napraia_admin";

export type Papel = "editor" | "leitor";

const VALIDADE_MS = 12 * 60 * 60 * 1000; // 12h — uma jornada de trabalho

/**
 * Os códigos vivem só no ambiente. Este repositório é público: um valor
 * padrão aqui dentro seria a senha do painel exposta no GitHub. Sem a
 * variável, ninguém entra — falha fechado, nunca aberto.
 */
function codigos(): Array<{ papel: Papel; codigo: string }> {
  const lista: Array<{ papel: Papel; codigo: string }> = [];
  if (process.env.ADMIN_ACCESS_CODE) {
    lista.push({ papel: "editor", codigo: process.env.ADMIN_ACCESS_CODE });
  }
  if (process.env.ADMIN_VIEW_CODE) {
    lista.push({ papel: "leitor", codigo: process.env.ADMIN_VIEW_CODE });
  }
  if (lista.length === 0) {
    console.error(
      "[admin] Nenhum código configurado (ADMIN_ACCESS_CODE / ADMIN_VIEW_CODE) — o painel fica inacessível."
    );
  }
  return lista;
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

/** Devolve o papel do código informado, ou null se não bater com nenhum. */
export function papelDoCodigo(informado: string): Papel | null {
  const limpo = informado.trim();
  // Percorre a lista inteira de propósito: sair no primeiro acerto vazaria,
  // pelo tempo de resposta, qual dos códigos foi digitado.
  let achado: Papel | null = null;
  for (const { papel, codigo } of codigos()) {
    if (iguais(limpo, codigo)) achado = papel;
  }
  return achado;
}

export function criarSessao(papel: Papel): string {
  const payload = `admin.${papel}.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${assinar(payload)}`;
}

/** Papel válido carregado no token, ou null se ausente, adulterado ou vencido. */
export function papelDaSessao(token: string | undefined): Papel | null {
  if (!token) return null;
  // Sem código configurado o painel está desligado: nem cookie antigo entra.
  if (codigos().length === 0) return null;

  const partes = token.split(".");
  if (partes.length !== 2) return null;

  const [corpo, assinatura] = partes;
  let payload: string;
  try {
    payload = Buffer.from(corpo, "base64url").toString("utf8");
  } catch {
    return null;
  }

  if (!iguais(assinatura, assinar(payload))) return null;

  const [marca, papel, emitidoEm] = payload.split(".");
  if (marca !== "admin" || !emitidoEm) return null;
  if (papel !== "editor" && papel !== "leitor") return null;
  if (Date.now() - Number(emitidoEm) > VALIDADE_MS) return null;

  // Um código revogado no ambiente derruba o papel correspondente na hora.
  if (!codigos().some((c) => c.papel === papel)) return null;

  return papel;
}

/** Lê o cookie da requisição atual. Use em Server Components e Server Actions. */
export async function papelAtual(): Promise<Papel | null> {
  const jar = await cookies();
  return papelDaSessao(jar.get(ADMIN_COOKIE)?.value);
}

/** Barreira das ações de escrita. Só o editor passa — o leitor é barrado aqui,
 *  no servidor, e não só pela ausência do botão na tela. */
export async function exigirEditor(): Promise<void> {
  const papel = await papelAtual();
  if (papel === "editor") return;
  throw new Error(
    papel === "leitor"
      ? "Seu acesso é somente leitura. Entre com o código de edição para alterar dados."
      : "Sessão expirada. Entre novamente no painel."
  );
}

/** Barreira das ações de leitura: qualquer papel válido serve. */
export async function exigirSessao(): Promise<Papel> {
  const papel = await papelAtual();
  if (!papel) throw new Error("Sessão expirada. Entre novamente no painel.");
  return papel;
}

export const COOKIE_OPTS = {
  httpOnly: true,
  sameSite: "lax",
  secure: process.env.NODE_ENV === "production",
  path: "/",
  maxAge: VALIDADE_MS / 1000,
} as const;
