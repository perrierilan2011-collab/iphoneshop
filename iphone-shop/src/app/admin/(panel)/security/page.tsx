import ActionForm from '@/components/admin/ActionForm';
import { Field } from '@/components/admin/Field';
import { changePassword } from '../../actions';

export default function Security() {
  return (
    <>
      <h1>Sécurité</h1>
      <p className="muted">L'accès est contrôlé côté serveur : session Supabase valide et compte présent dans la table admin_users.</p>
      <h2>Changer le mot de passe</h2>
      <div className="box">
        <ActionForm action={changePassword} submit="Changer le mot de passe">
          <Field label="Nouveau mot de passe" hint="12 caractères minimum."><input type="password" name="password" autoComplete="new-password" minLength={12} required /></Field>
          <Field label="Confirmation"><input type="password" name="confirm" autoComplete="new-password" minLength={12} required /></Field>
        </ActionForm>
      </div>
    </>
  );
}
