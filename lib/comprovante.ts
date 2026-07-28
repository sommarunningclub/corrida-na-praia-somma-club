/**
 * Comprovante da lista VIP guardado entre o formulário e a página /obrigado.
 *
 * Usa sessionStorage (não query string) por dois motivos: os dados pessoais
 * não aparecem na URL nem em históricos/logs, e o comprovante morre quando a
 * aba fecha. O CPF é gravado já mascarado.
 */

export type Comprovante = {
  nome: string;
  email: string;
  telefone: string;
  cpfMascarado: string;
  codigo: string | null;
};

const CHAVE = "napraia:comprovante";

export function guardarComprovante(dados: Comprovante): void {
  try {
    sessionStorage.setItem(CHAVE, JSON.stringify(dados));
  } catch {
    // Modo privado ou storage cheio: a página de obrigado cai no estado
    // genérico, sem os dados. O cadastro em si já foi concluído.
  }
}

export function lerComprovante(): Comprovante | null {
  try {
    const bruto = sessionStorage.getItem(CHAVE);
    if (!bruto) return null;
    const dados = JSON.parse(bruto) as Partial<Comprovante>;
    if (!dados?.nome || !dados?.email) return null;
    return {
      nome: dados.nome,
      email: dados.email,
      telefone: dados.telefone ?? "",
      cpfMascarado: dados.cpfMascarado ?? "",
      codigo: dados.codigo ?? null,
    };
  } catch {
    return null;
  }
}

/** 123.456.789-01 → •••.456.789-01 */
export function mascararCpf(cpf: string): string {
  const d = cpf.replace(/\D/g, "");
  if (d.length !== 11) return "";
  return `•••.${d.slice(3, 6)}.${d.slice(6, 9)}-${d.slice(9)}`;
}
