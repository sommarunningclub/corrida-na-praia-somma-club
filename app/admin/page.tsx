import { estaAutenticado } from "@/lib/admin-auth";
import { listarLeads } from "@/lib/admin-store";
import { listaVipFechada } from "@/lib/config-store";
import { LoginAdmin } from "@/app/admin/login-admin";
import { Painel } from "@/app/admin/painel";

// Painel sempre fresco: nada de servir lista de leads de cache.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  if (!(await estaAutenticado())) {
    return <LoginAdmin />;
  }

  // Um erro de banco aqui não pode virar tela branca: o painel mostra o motivo.
  let leads = null;
  let erro = "";
  try {
    leads = await listarLeads();
  } catch (e) {
    erro = (e as Error).message;
  }

  return (
    <Painel leads={leads ?? []} fechada={await listaVipFechada()} erroCarga={erro} />
  );
}
