import { createClient } from "@supabase/supabase-js";

/**
 * Client con privilegi pieni: scavalca le regole RLS.
 * Da usare SOLO dentro codice che gira sul server (route API),
 * mai in un componente che finisce nel browser.
 */
export function createAdminClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    { auth: { persistSession: false, autoRefreshToken: false } }
  );
}
