import 'server-only';
import { serviceClient } from './supabase/service';

/** Note la dernière connexion (et crée le profil s'il manquait). N'écrase jamais « whitelisted ». */
export async function recordLogin(userId: string, email: string | undefined | null) {
  const { error } = await serviceClient()
    .from('profiles')
    .upsert({ user_id: userId, email: email ?? '', last_login_at: new Date().toISOString() }, { onConflict: 'user_id' });
  if (error) console.error('[accounts] recordLogin', error.message);
}
