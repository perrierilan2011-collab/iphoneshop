import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getAccess } from '@/lib/auth';
import { signOut } from './actions';

export const metadata: Metadata = { title: 'Mon compte', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ComptePage() {
  const a = await getAccess();
  if (!a.user) redirect('/connexion');
  return (
    <div className="auth">
      <div className="box">
        <h1 className="auth-title">Mon compte</h1>
        <p className="muted small">Connecté en tant que</p>
        <p style={{ margin: '2px 0 18px', wordBreak: 'break-all' }}>{a.user.email}</p>
        {a.canAdmin && <p className="msg ok small" style={{ marginBottom: 16 }}>Accès administration débloqué : utilisez le bouton engrenage en bas à droite.</p>}
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          {a.canAdmin && <Link className="btn btn-primary btn-sm" href="/admin">Ouvrir le panel admin</Link>}
          <form action={signOut}><button className="btn btn-sm" type="submit">Se déconnecter</button></form>
        </div>
      </div>
    </div>
  );
}
