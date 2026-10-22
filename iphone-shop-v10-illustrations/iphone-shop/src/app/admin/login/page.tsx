import { redirect } from 'next/navigation';
import ActionForm from '@/components/admin/ActionForm';
import { Field } from '@/components/admin/Field';
import { supabaseServer } from '@/lib/supabase/server';
import { serviceClient } from '@/lib/supabase/service';
import { login } from '../actions';

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ denied?: string }> }) {
  const { denied } = await searchParams;
  const { data: { user } } = await (await supabaseServer()).auth.getUser();
  if (user) {
    const { data } = await serviceClient().from('admin_users').select('user_id').eq('user_id', user.id).maybeSingle();
    if (data) redirect('/admin');
  }
  return (
    <div className="login">
      <div className="box">
        <h1 style={{ fontSize: '1.4rem', marginBottom: 18 }}>Connexion administrateur</h1>
        {denied && <p className="msg err" style={{ marginBottom: 12 }}>Ce compte n'a pas les droits d'administration.</p>}
        <ActionForm action={login} submit="Se connecter" className="" >
          <div style={{ display: 'grid', gap: 14 }}>
            <Field label="Adresse e-mail"><input type="email" name="email" autoComplete="username" required /></Field>
            <Field label="Mot de passe"><input type="password" name="password" autoComplete="current-password" required /></Field>
          </div>
        </ActionForm>
      </div>
    </div>
  );
}
