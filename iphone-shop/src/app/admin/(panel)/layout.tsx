import Link from 'next/link';
import type { ReactNode } from 'react';
import { requireAdmin } from '@/lib/auth';
import { logout } from '../actions';

export default async function PanelLayout({ children }: { children: ReactNode }) {
  await requireAdmin(); // contrôle serveur sur chaque page du panel
  return (
    <div className="admin">
      <aside className="side">
        <span className="brand">Administration</span>
        <Link href="/admin">Vue d'ensemble</Link>
        <Link href="/admin/products">Produits</Link>
        <Link href="/admin/categories">Catégories du menu</Link>
        <Link href="/admin/illustrations">Illustrations</Link>
        <Link href="/admin/site">Personnalisation du site</Link>
        <Link href="/admin/security">Sécurité</Link>
        <Link href="/" target="_blank">Ouvrir le site public</Link>
        <form action={logout}><button className="link" type="submit">Se déconnecter</button></form>
      </aside>
      <div className="panel-main">{children}</div>
    </div>
  );
}
