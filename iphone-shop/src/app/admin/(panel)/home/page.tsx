import Link from 'next/link';
import { getSettings } from '@/lib/data';
import { serviceClient } from '@/lib/supabase/service';
import { moveHomeProduct, toggleHomeProduct } from '../../actions';

export default async function HomeProducts() {
  const [{ data }, s] = await Promise.all([
    serviceClient().from('products').select('id,name,is_published,show_on_home').order('display_order').order('created_at'),
    getSettings(),
  ]);
  const rows = data ?? [];
  const shown = rows.filter((p) => p.is_published && p.show_on_home);
  return (
    <>
      <h1>Produits de l'accueil</h1>
      <p className="muted">
        Choisissez quels produits apparaissent sur la page d'accueil et dans quel ordre (flèches). Un produit masqué ici reste accessible par son adresse
        et dans ses catégories. Seuls les produits publiés s'affichent ; l'accueil montre au maximum {s.home_max_products} produit(s)
        (réglable dans <Link href="/admin/site">Personnalisation</Link>).
      </p>
      <p className="muted small">{shown.length} produit(s) actuellement visible(s) sur l'accueil.</p>
      {rows.length === 0 && <p className="muted">Aucun produit.</p>}
      {rows.map((p, i) => (
        <div className="box rowhead" key={p.id}>
          <div>
            <strong>{p.name}</strong>{' '}
            <span className={p.is_published && p.show_on_home ? 'status live' : 'status'}>
              {!p.is_published ? 'Produit masqué (non publié)' : p.show_on_home ? 'Affiché sur l\'accueil' : 'Caché de l\'accueil'}
            </span>
          </div>
          <div className="move">
            <form action={toggleHomeProduct}>
              <input type="hidden" name="product_id" value={p.id} /><input type="hidden" name="show" value={p.show_on_home ? '0' : '1'} />
              <button type="submit" className="btn btn-sm">{p.show_on_home ? 'Cacher de l\'accueil' : 'Afficher sur l\'accueil'}</button>
            </form>
            {[['up', '▲', 'Monter'], ['down', '▼', 'Descendre']].map(([dir, sym, lab]) => (
              <form action={moveHomeProduct} key={dir}>
                <input type="hidden" name="product_id" value={p.id} /><input type="hidden" name="dir" value={dir} />
                <button type="submit" className="btn btn-sm btn-ghost" aria-label={`${lab} ${p.name}`} disabled={(dir === 'up' && i === 0) || (dir === 'down' && i === rows.length - 1)}>{sym}</button>
              </form>
            ))}
          </div>
        </div>
      ))}
    </>
  );
}
