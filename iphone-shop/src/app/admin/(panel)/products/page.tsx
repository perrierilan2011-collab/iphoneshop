import Link from 'next/link';
import ActionForm from '@/components/admin/ActionForm';
import { Field } from '@/components/admin/Field';
import { PRODUCT_SELECT, shape } from '@/lib/data';
import { formatPrice, startingPrice } from '@/lib/pricing';
import { serviceClient } from '@/lib/supabase/service';
import { createProduct } from '../../actions';

export default async function Products() {
  const { data } = await serviceClient().from('products').select(PRODUCT_SELECT).order('display_order');
  const products = (data ?? []).map((r) => shape(r, false));
  return (
    <>
      <h1>Produits</h1>
      {products.map((p) => {
        const price = startingPrice(p);
        return (
          <div className="box" key={p.id}>
            <div className="rowhead">
              <div>
                <strong>{p.name}</strong> <span className={p.is_published ? 'status live' : 'status'}>{p.is_published ? 'Publié' : 'Masqué'}</span>
                {p.is_demo_data && <span className="status" style={{ marginLeft: 6 }}>Démo</span>}
                <p className="muted small">
                  {p.colors.filter((c) => c.is_enabled).length} couleur(s) active(s) · {p.storages.filter((s) => s.is_enabled).length} stockage(s) actif(s) · {price !== null ? `dès ${formatPrice(price)}` : 'aucun prix'}
                </p>
              </div>
              <div style={{ display: 'flex', gap: 8 }}>
                <Link className="btn btn-sm btn-ghost" href={`/admin/preview/${p.id}`}>Prévisualiser</Link>
                <Link className="btn btn-sm" href={`/admin/products/${p.id}`}>Modifier</Link>
              </div>
            </div>
          </div>
        );
      })}
      <h2>Ajouter un produit</h2>
      <div className="box">
        <ActionForm action={createProduct} submit="Créer le produit">
          <Field label="Nom" hint="Le slug (adresse de la page) en est déduit ; vous pourrez le modifier."><input name="name" required maxLength={80} /></Field>
        </ActionForm>
      </div>
    </>
  );
}
