import 'server-only';
import { createClient } from '@supabase/supabase-js';

/** Clé service_role : contourne la RLS. Uniquement après requireAdmin(). Jamais exposée au navigateur. */
export function serviceClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}
