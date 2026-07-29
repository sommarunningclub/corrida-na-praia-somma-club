import "server-only";
import { unstable_cache, revalidateTag } from "next/cache";
import { getServiceSupabase } from "@/lib/supabase";

/**
 * Chaves de operação que a equipe muda pelo /admin sem precisar de deploy.
 *
 * Mora em `app_settings`, a tabela key/value que os outros sites Somma já
 * usam no mesmo projeto Supabase — daí o prefixo `napraia_` para não
 * atropelar chave de vizinho.
 */

const TABELA = "app_settings";
const CHAVE_FECHADA = "napraia_lista_vip_fechada";

export const TAG_CONFIG = "napraia-config";

/**
 * A home é estática. Ler o banco a cada visita jogaria isso fora, então o
 * valor fica em cache com tag e a ação do admin invalida na hora — o site
 * segue pré-renderizado e o toggle reflete em segundos.
 */
export const listaVipFechada = unstable_cache(
  async (): Promise<boolean> => {
    const supabase = getServiceSupabase();
    if (!supabase) return false;

    const { data, error } = await supabase
      .from(TABELA)
      .select("value")
      .eq("key", CHAVE_FECHADA)
      .maybeSingle();

    // Na dúvida, aberto: uma falha de leitura não pode derrubar o cadastro.
    if (error) {
      console.error("[config] Falha ao ler flag da lista VIP:", error.message);
      return false;
    }

    return data?.value === "true";
  },
  ["napraia-lista-vip-fechada"],
  { tags: [TAG_CONFIG], revalidate: 60 }
);

export async function definirListaVipFechada(fechada: boolean): Promise<void> {
  const supabase = getServiceSupabase();
  if (!supabase) throw new Error("Supabase indisponível.");

  const { error } = await supabase.from(TABELA).upsert(
    {
      key: CHAVE_FECHADA,
      value: fechada ? "true" : "false",
      updated_at: new Date().toISOString(),
    },
    { onConflict: "key" }
  );

  if (error) throw new Error(`Não foi possível salvar: ${error.message}`);

  revalidateTag(TAG_CONFIG);
}

/** Resposta única para as três rotas públicas de cadastro quando está fechado. */
export const MSG_FECHADA =
  "As inscrições na lista VIP estão encerradas. Acompanhe o @somma.club para as próximas novidades.";
