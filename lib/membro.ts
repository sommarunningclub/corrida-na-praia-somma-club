import "server-only";
import { createHmac, timingSafeEqual } from "crypto";

/**
 * Utilidades do fluxo "já sou membro": mascaramento dos dados exibidos na
 * confirmação e token assinado que liga a etapa do CPF à etapa de confirmar.
 *
 * Por que mascarar: o endpoint de verificação é público e recebe um CPF.
 * Devolver nome/e-mail/telefone completos permitiria varrer CPFs e extrair a
 * base inteira de membros. A prévia mascarada é suficiente para a pessoa se
 * reconhecer e inútil para quem está coletando dados.
 */

export const CPF_TABELA_MEMBROS = "cadastro_site";

/** "Alex Rodrigues dos Santos" → "Alex R. dos S." */
export function mascararNome(nome: string): string {
  const partes = nome.trim().split(/\s+/).filter(Boolean);
  if (partes.length === 0) return "";
  const minusculas = new Set(["de", "da", "do", "das", "dos", "e"]);
  return partes
    .map((parte, i) => {
      if (i === 0) return parte;
      if (minusculas.has(parte.toLowerCase())) return parte.toLowerCase();
      return `${parte[0].toUpperCase()}.`;
    })
    .join(" ");
}

/** "alex.icm.rs@gmail.com" → "al•••••@gmail.com" */
export function mascararEmail(email: string): string {
  const [usuario, dominio] = email.split("@");
  if (!dominio) return "•••";
  const visivel = usuario.slice(0, 2);
  return `${visivel}${"•".repeat(Math.max(3, usuario.length - 2))}@${dominio}`;
}

/** "(61) 99537-2477" → "(61) •••••-••77" */
export function mascararTelefone(telefone: string): string {
  const d = telefone.replace(/\D/g, "");
  if (d.length < 10) return "•••";
  const ddd = d.slice(0, 2);
  const fim = d.slice(-2);
  return `(${ddd}) •••••-••${fim}`;
}

/* ─── Token da etapa de confirmação ───────────────────────────────────────── */

const VALIDADE_MS = 15 * 60 * 1000; // 15 minutos

function segredo(): string {
  // Sem segredo dedicado, deriva da service role key (já secreta no servidor).
  return (
    process.env.LISTA_VIP_TOKEN_SECRET ||
    process.env.SUPABASE_SERVICE_ROLE_KEY ||
    "napraia-dev-secret"
  );
}

function assinar(payload: string): string {
  return createHmac("sha256", segredo()).update(payload).digest("base64url");
}

/**
 * Token que carrega o CPF verificado. A etapa de confirmar não aceita um CPF
 * solto do cliente: só age sobre um CPF que esta aplicação já verificou.
 */
export function criarTokenMembro(cpfDigits: string): string {
  const payload = `${cpfDigits}.${Date.now()}`;
  return `${Buffer.from(payload).toString("base64url")}.${assinar(payload)}`;
}

export function lerTokenMembro(token: string): string | null {
  const partes = token.split(".");
  if (partes.length !== 2) return null;

  const [corpo, assinatura] = partes;
  let payload: string;
  try {
    payload = Buffer.from(corpo, "base64url").toString("utf8");
  } catch {
    return null;
  }

  const esperada = assinar(payload);
  const a = Buffer.from(assinatura);
  const b = Buffer.from(esperada);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  const [cpf, emitidoEm] = payload.split(".");
  if (!cpf || !emitidoEm) return null;
  if (Date.now() - Number(emitidoEm) > VALIDADE_MS) return null;
  if (!/^\d{11}$/.test(cpf)) return null;

  return cpf;
}

/* ─── Limite de tentativas ────────────────────────────────────────────────── */

const tentativas = new Map<string, { contador: number; janelaAte: number }>();
const JANELA_MS = 10 * 60 * 1000;
const MAX_POR_JANELA = 10;

/**
 * Freio simples por IP contra varredura de CPFs. É em memória: serve para uma
 * instância e some a cada deploy. Se o volume crescer, trocar por algo
 * compartilhado (Vercel KV, Upstash) ou pelo Firewall/BotID da Vercel.
 */
export function excedeuTentativas(ip: string): boolean {
  const agora = Date.now();
  const atual = tentativas.get(ip);

  if (!atual || agora > atual.janelaAte) {
    tentativas.set(ip, { contador: 1, janelaAte: agora + JANELA_MS });
    return false;
  }

  atual.contador += 1;

  // Faxina oportunista para o Map não crescer sem limite.
  if (tentativas.size > 5000) {
    for (const [chave, valor] of tentativas) {
      if (agora > valor.janelaAte) tentativas.delete(chave);
    }
  }

  return atual.contador > MAX_POR_JANELA;
}

export function ipDaRequisicao(request: Request): string {
  const encaminhado = request.headers.get("x-forwarded-for");
  if (encaminhado) return encaminhado.split(",")[0].trim();
  return request.headers.get("x-real-ip") ?? "desconhecido";
}

/** CPF nos dois formatos usados historicamente na base. */
export function formatosDeCpf(cpfDigits: string): string[] {
  const formatado = cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
  return [cpfDigits, formatado];
}

export function formatarCpf(cpfDigits: string): string {
  return cpfDigits.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, "$1.$2.$3-$4");
}
