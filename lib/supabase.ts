import { createClient, type SupabaseClient } from "@supabase/supabase-js";

/** Client server-side com service_role. A tabela tem RLS sem policies,
 *  então só este client consegue escrever/ler os leads. */
export function getServiceSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    console.error(
      "[supabase] SUPABASE_URL ou SUPABASE_SERVICE_ROLE_KEY ausentes — configure no ambiente."
    );
    return null;
  }
  return createClient(url, key, {
    auth: { autoRefreshToken: false, persistSession: false },
  });
}

export const LISTA_VIP_TABLE = "napraia_lista_vip";
