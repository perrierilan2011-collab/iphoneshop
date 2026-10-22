import 'server-only';
import { redirect } from 'next/navigation';
import { supabaseServer } from './supabase/server';
import { serviceClient } from './supabase/service';

/**
 * Qui est connecté, et que peut-il faire ?
 * - propriétaire : présent dans admin_users (créé par create-admin / setup) ; peut whitelister.
 * - whitelisté   : drapeau profiles.whitelisted posé par un propriétaire ; accède au panel admin.
 * Le jeton est validé auprès de Supabase (getUser), jamais lu tel quel depuis le cookie.
 */
export async function getAccess() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) return { user: null, isOwner: false, whitelisted: false, canAdmin: false };
  const svc = serviceClient();
  const [owner, profile] = await Promise.all([
    svc.from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle(),
    svc.from('profiles').select('whitelisted').eq('user_id', user.id).maybeSingle(),
  ]);
  const isOwner = Boolean(owner.data);
  const whitelisted = Boolean(profile.data?.whitelisted);
  return { user, isOwner, whitelisted, canAdmin: isOwner || whitelisted };
}

/** Panel admin : session valide ET (propriétaire OU whitelisté). Redirige sinon. */
export async function requireAdmin() {
  const a = await getAccess();
  if (!a.user) redirect('/admin/login');
  if (!a.canAdmin) redirect('/admin/login?denied=1');
  return a.user;
}

/** Réservé aux propriétaires (ex. whitelister un compte). */
export async function requireOwner() {
  const a = await getAccess();
  if (!a.user) redirect('/admin/login');
  if (!a.isOwner) redirect('/admin');
  return a.user;
}
