import type { Metadata } from 'next';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import ActionForm from '@/components/admin/ActionForm';
import { Field } from '@/components/admin/Field';
import { supabaseServer } from '@/lib/supabase/server';
import { signUp } from '../compte/actions';

export const metadata: Metadata = { title: 'Créer un compte', robots: { index: false, follow: false } };
export const dynamic = 'force-dynamic';

export default async function InscriptionPage() {
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (user) redirect('/compte');
  return (
    <div className="auth">
      <div className="box">
        <h1 className="auth-title">Créer un compte</h1>
        <ActionForm action={signUp} submit="Créer mon compte" className="">
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Adresse e-mail"><input type="email" name="email" autoComplete="username" required /></Field>
            <Field label="Mot de passe" hint="8 caractères minimum."><input type="password" name="password" autoComplete="new-password" minLength={8} maxLength={72} required /></Field>
            <Field label="Confirmation du mot de passe"><input type="password" name="confirm" autoComplete="new-password" minLength={8} maxLength={72} required /></Field>
          </div>
        </ActionForm>
        <p className="muted small" style={{ marginTop: 18 }}>Déjà un compte ? <Link href="/connexion" style={{ color: 'var(--accent)' }}>Se connecter</Link></p>
      </div>
    </div>
  );
}
