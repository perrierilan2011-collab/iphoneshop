import { getAccess } from '@/lib/auth';
import { serviceClient } from '@/lib/supabase/service';
import AccountList, { type AccountRow } from '@/components/admin/AccountList';

export const dynamic = 'force-dynamic';

export default async function Comptes() {
  const access = await getAccess();
  const svc = serviceClient();
  const [{ data: profiles, error }, { data: owners }] = await Promise.all([
    svc.from('profiles').select('user_id,email,whitelisted,created_at,last_login_at').order('created_at', { ascending: false }).limit(10000),
    svc.from('admin_users').select('user_id'),
  ]);
  const ownerIds = new Set((owners ?? []).map((o) => o.user_id as string));
  const rows: AccountRow[] = (profiles ?? []).map((p) => ({
    id: p.user_id as string,
    email: (p.email as string) || '(sans e-mail)',
    whitelisted: Boolean(p.whitelisted),
    isOwner: ownerIds.has(p.user_id as string),
    createdAt: p.created_at as string,
    lastLoginAt: (p.last_login_at as string | null) ?? null,
  }));
  return (
    <>
      <h1>Comptes</h1>
      <p className="muted">Toutes les personnes qui ont créé un compte sur le site. Un compte whitelisté voit le bouton engrenage et peut ouvrir ce panel.</p>
      {error && <p className="warn">Liste indisponible : exécutez d'abord la migration <code>0009_accounts.sql</code> dans Supabase (SQL Editor).</p>}
      <AccountList rows={rows} canManage={access.isOwner} />
    </>
  );
}
