import Link from 'next/link';
import { serviceClient } from '@/lib/supabase/service';

export default async function Overview() {
  const { data } = await serviceClient().from('products').select('id,name,is_published,updated_at').order('updated_at', { ascending: false });
  const rows = data ?? [];
  const published = rows.filter((r) => r.is_published).length;
  return (
    <>
      <h1>Vue d'ensemble</h1>
      <p className="muted">Les modifications enregistrées ici sont visibles immédiatement par tous les visiteurs.</p>
      <div className="stats" style={{ marginTop: 24 }}>
        <div className="box stat"><b>{published}</b><span className="muted">produits publiés</span></div>
        <div className="box stat"><b>{rows.length - published}</b><span className="muted">produits masqués</span></div>
      </div>
      <h2>Dernières modifications</h2>
      {rows.length === 0 ? <p className="muted">Aucun produit.</p> : rows.slice(0, 5).map((r) => (
        <div className="box rowhead" key={r.id}>
          <span>{r.name} <span className="muted small">— {new Date(r.updated_at).toLocaleString('fr-FR')}</span></span>
          <Link className="btn btn-sm" href={`/admin/products/${r.id}`}>Modifier</Link>
        </div>
      ))}
      <p style={{ marginTop: 24 }}><Link className="btn btn-primary" href="/admin/products">Gérer les produits</Link></p>
    </>
  );
}
