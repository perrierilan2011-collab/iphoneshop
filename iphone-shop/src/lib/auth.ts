import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import { serviceClient } from './supabase/service';

/** Vérifie côté serveur : session valide ET présence dans admin_users. Redirige sinon. */
export async function requireAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser(); // valide le jeton auprès de Supabase
  if (!user) redirect('/admin/login');
  const { data } = await serviceClient().from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
  if (!data) redirect('/admin/login?denied=1');
  return user;
}
