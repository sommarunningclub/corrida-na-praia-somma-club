import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import { LISTA_VIP_TABLE } from "@/lib/supabase";
import { GRUPOS_WHATSAPP } from "@/lib/napraia-data";

/**
 * Rodízio dos grupos do WhatsApp da comunidade.
 *
 * Sorteio puro com três grupos e algumas centenas de cadastros deixa desvios
 * visíveis (um grupo com 38% e outro com 30%). Aqui o próximo grupo sai da
 * contagem de quem já foi distribuído, então os grupos crescem parelhos.
 */

/**
 * Próximo grupo da fila. Só é chamado para quem acabou de virar membro: quem
 * já era da comunidade não recebe convite porque já está nos grupos.
 *
 * A contagem e o insert não são atômicos: dois cadastros no mesmo instante
 * podem ler o mesmo total e cair no mesmo grupo. O desvio máximo é de uma
 * pessoa por colisão, o que não justifica o custo de serializar a escrita.
 */
export async function proximoGrupo(supabase: SupabaseClient): Promise<number> {
  const total = GRUPOS_WHATSAPP.length;

  const { count, error } = await supabase
    .from(LISTA_VIP_TABLE)
    .select("id", { count: "exact", head: true })
    .not("grupo_whatsapp", "is", null);

  // Falha na contagem não pode custar o convite: cai no sorteio, que distribui
  // pior mas continua entregando alguém em algum grupo.
  if (error || count === null) {
    if (error) console.error("[grupos] Falha ao contar distribuídos:", error);
    return GRUPOS_WHATSAPP[Math.floor(Math.random() * total)].numero;
  }

  return GRUPOS_WHATSAPP[count % total].numero;
}
