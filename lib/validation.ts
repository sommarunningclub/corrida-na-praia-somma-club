import { z } from "zod";

export const listaVipSchema = z.object({
  nome: z
    .string()
    .trim()
    .min(3, "Informe seu nome completo.")
    .max(120, "Nome muito longo.")
    .refine((v) => v.split(/\s+/).length >= 2, "Informe nome e sobrenome."),
  email: z.string().trim().toLowerCase().email("E-mail inválido."),
  telefone: z
    .string()
    .trim()
    .refine((v) => {
      const d = onlyDigits(v);
      return d.length === 10 || d.length === 11;
    }, "Telefone inválido. Use DDD + número."),
  cpf: z.string().trim().refine(isValidCpf, "CPF inválido."),
  // Honeypot anti-bot: precisa chegar vazio.
  // Honeypot: aceita qualquer valor aqui. Quem decide é a API route, que
  // responde 200 silencioso quando vem preenchido — devolver 422 apontando
  // este campo entregaria ao bot exatamente o que ele precisa contornar.
  website: z.string().optional(),
  utm_source: z.string().max(120).optional(),
  utm_medium: z.string().max(120).optional(),
  utm_campaign: z.string().max(120).optional(),
});

export type ListaVipInput = z.infer<typeof listaVipSchema>;

export function onlyDigits(value: string): string {
  return value.replace(/\D/g, "");
}

/* ─── Máscaras ─────────────────────────────────────────────────────────── */

export function maskCpf(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  return d
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d)/, "$1.$2")
    .replace(/(\d{3})(\d{1,2})$/, "$1-$2");
}

export function maskPhone(value: string): string {
  const d = onlyDigits(value).slice(0, 11);
  if (d.length <= 2) return d;
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`;
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
}

/* ─── Validação de CPF (dígitos verificadores) ─────────────────────────── */

export function isValidCpf(value: string): boolean {
  const cpf = onlyDigits(value);
  if (cpf.length !== 11 || /^(\d)\1{10}$/.test(cpf)) return false;
  const calc = (factor: number) => {
    let sum = 0;
    for (let i = 0; i < factor - 1; i++) sum += Number(cpf[i]) * (factor - i);
    const rest = (sum * 10) % 11;
    return rest === 10 ? 0 : rest;
  };
  return calc(10) === Number(cpf[9]) && calc(11) === Number(cpf[10]);
}

/** Primeiro nome, com capitalização — usado no e-mail e na tela de sucesso. */
export function firstName(nome: string): string {
  const first = nome.trim().split(/\s+/)[0] ?? "";
  return first.charAt(0).toUpperCase() + first.slice(1).toLowerCase();
}
