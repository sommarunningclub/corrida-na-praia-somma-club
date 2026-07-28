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

/* ─── Cadastro de novo membro do Somma Club ───────────────────────────────── */
// Espelha o cadastro da home do Somma (tabela `cadastro_site`), para que quem
// entra pela Corrida na Praia já vire membro com o mesmo conjunto de dados.

export const novoMembroSchema = z.object({
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
    }, "Telefone inválido. Informe o DDD e o número."),
  cpf: z.string().trim().refine(isValidCpf, "CPF inválido."),
  data_nascimento: z
    .string()
    .trim()
    .refine(isValidBirthDate, "Data de nascimento inválida."),
  cep: z
    .string()
    .trim()
    .refine((v) => onlyDigits(v).length === 8, "CEP inválido."),
  sexo: z.enum(["masculino", "feminino", "outro", "prefiro-nao-dizer"], {
    message: "Selecione uma opção.",
  }),
  consent_lgpd: z.literal(true, {
    message: "É preciso aceitar o tratamento dos dados (LGPD).",
  }),
  website: z.string().optional(),
});

export type NovoMembroInput = z.infer<typeof novoMembroSchema>;

export function maskCep(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 5) return d;
  return `${d.slice(0, 5)}-${d.slice(5)}`;
}

export function maskDate(value: string): string {
  const d = onlyDigits(value).slice(0, 8);
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, 2)}/${d.slice(2)}`;
  return `${d.slice(0, 2)}/${d.slice(2, 4)}/${d.slice(4)}`;
}

export function isValidBirthDate(value: string): boolean {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return false;
  const dia = Number(m[1]);
  const mes = Number(m[2]);
  const ano = Number(m[3]);
  if (mes < 1 || mes > 12 || dia < 1 || dia > 31) return false;

  const anoAtual = new Date().getFullYear();
  if (ano < 1900 || ano > anoAtual) return false;

  // Rejeita datas que não existem (31/02, por exemplo).
  const data = new Date(ano, mes - 1, dia);
  if (
    data.getFullYear() !== ano ||
    data.getMonth() !== mes - 1 ||
    data.getDate() !== dia
  ) {
    return false;
  }

  // Menores de 16 não podem se inscrever sozinhos.
  const idade = anoAtual - ano;
  return idade >= 16 && idade <= 110;
}

/** "06/09/1990" → "1990-09-06" (formato usado em cadastro_site). */
export function brDateToISO(value: string): string | null {
  const m = value.match(/^(\d{2})\/(\d{2})\/(\d{4})$/);
  if (!m) return null;
  return `${m[3]}-${m[2]}-${m[1]}`;
}
