import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ActionForm from '@/components/admin/ActionForm';
import { Field } from '@/components/admin/Field';
import { supabaseServer } from '@/lib/supabase/server';
import { signIn } from '../compte/actions';

export const metadata: Metadata = { title: 'Connexion', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function ConnexionPage() {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (user) redirect('/compte');
  return (
    <div className="auth">
      <div className="box">
        <h1 className="auth-title">Connexion</h1>
        <ActionForm action={signIn} submit="Se connecter" className="">
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Adresse e-mail"><input type="email" name="email" autoComplete="username" required /></Field>
            <Field label="Mot de passe"><input type="password" name="password" autoComplete="current-password" required /></Field>
          </div>
        </ActionForm>
        <p className="muted small" style={{ marginTop: 18 }}>Pas encore de compte ? <Link href="/inscription" style={{ color: 'var(--accent)' }}>Créer un compte</Link></p>
      </div>
    </div>
  );
}
