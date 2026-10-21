import Link from 'next/link';
import ActionForm from '@/components/admin/ActionForm';
import { setupAdmin } from '../actions';

export const dynamic = 'force-dynamic';

/**
 * Création / réinitialisation du compte administrateur à partir de deux variables Vercel :
 * ADMIN_EMAIL et ADMIN_PASSWORD. Supprimez-les de Vercel dès que c'est fait : la page se désactive alors.
 */
export default function SetupPage() {
  const ready = Boolean(process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD);
  return (
    <div className="login">
      <div className="box">
        <h1 style={{ fontSize: '1.4rem', marginBottom: 18 }}>Compte administrateur</h1>
        {!ready ? (
          <p className="muted">Cette page est désactivée. Elle ne s'active que lorsque les variables ADMIN_EMAIL et ADMIN_PASSWORD sont définies dans Vercel.</p>
        ) : (
          <>
            <p className="muted" style={{ marginBottom: 14 }}>
              Le compte défini par ADMIN_EMAIL va être créé, ou son mot de passe remplacé par la valeur de ADMIN_PASSWORD.
            </p>
            <ActionForm action={setupAdmin} submit="Créer / réinitialiser le compte" className="" />
            <p style={{ marginTop: 14 }}><Link href="/admin/login">Aller à la connexion</Link></p>
            <p className="hint" style={{ marginTop: 14 }}>
              Une fois connecté, supprimez ADMIN_EMAIL et ADMIN_PASSWORD dans Vercel, puis redéployez.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
