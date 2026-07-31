import { papelAtual } from "@/lib/admin-auth";
import { listarLeads } from "@/lib/admin-store";
import { resumoCampanha } from "@/lib/emails/disparo-store";
import { listaVipFechada } from "@/lib/config-store";
import { LoginAdmin } from "@/app/admin/login-admin";
import { Painel } from "@/app/admin/painel";

// Painel sempre fresco: nada de servir lista de leads de cache.
export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const papel = await papelAtual();
  if (!papel) return <LoginAdmin />;

  // Um erro de banco aqui não pode virar tela branca: o painel mostra o motivo.
  let leads = null;
  let erro = "";
  try {
    leads = await listarLeads();
  } catch (e) {
    erro = (e as Error).message;
  }

  // A campanha é acessória: se ela falhar, o painel de inscritos segue de pé.
  let ondas = null;
  try {
    ondas = await resumoCampanha();
  } catch (e) {
    erro = erro || (e as Error).message;
  }

  return (
    <Painel
      leads={leads ?? []}
      ondas={ondas ?? []}
      fechada={await listaVipFechada()}
      erroCarga={erro}
      papel={papel}
    />
  );
}
