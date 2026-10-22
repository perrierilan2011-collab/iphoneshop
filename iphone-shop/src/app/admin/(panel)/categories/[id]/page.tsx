import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/admin/ActionForm';
import { Check, Field } from '@/components/admin/Field';
import { serviceClient } from '@/lib/supabase/service';
import { deleteCategory, moveCategoryProduct, saveCategory, saveCategoryProducts } from '../../../actions';

export default async function EditCategory({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/i.test(id)) notFound();
  const db = serviceClient();
  const [{ data: c }, { data: products }, { data: links }] = await Promise.all([
    db.from('categories').select('*').eq('id', id).maybeSingle(),
    db.from('products').select('id,name,slug,is_published,display_order').order('display_order'),
    db.from('category_products').select('product_id,display_order').eq('category_id', id),
  ]);
  if (!c) notFound();
  const sel = new Map((links ?? []).map((l) => [l.product_id as string, l.display_order as number]));
  // Même tri que sur le site : ordre de la catégorie, puis ordre global, puis nom.
  const ranked = (products ?? []).filter((p) => sel.has(p.id)).sort((a, b) => ((sel.get(a.id) ?? 0) - (sel.get(b.id) ?? 0)) || (a.display_order - b.display_order) || a.name.localeCompare(b.name));
  return (
    <>
      <p><Link href="/admin/categories">← Catégories</Link></p>
      <h1>{c.name}</h1>

      <h2>Réglages</h2>
      <div className="box">
        <ActionForm action={saveCategory} submit="Enregistrer">
          <input type="hidden" name="id" value={c.id} />
          <Field label="Nom dans le menu"><input name="name" required maxLength={40} defaultValue={c.name} /></Field>
          <Field label="Adresse (slug)" hint={`La page sera /categorie/${c.slug}`}><input name="slug" required maxLength={80} defaultValue={c.slug} /></Field>
          <Field label="Titre de la page" hint="Facultatif. Par défaut : le nom."><input name="title" maxLength={80} defaultValue={c.title ?? ''} /></Field>
          <Field label="Texte d'introduction"><textarea name="description" rows={3} maxLength={500} defaultValue={c.description ?? ''} /></Field>
          <Field label="Position dans le menu"><input name="display_order" type="number" min={0} max={9999} defaultValue={c.display_order} /></Field>
          <Check name="is_published" label="Publiée (visible dans le menu)" checked={c.is_published} />
        </ActionForm>
      </div>

      <h2>Articles affichés dans cette catégorie</h2>
      <div className="box">
        {(products ?? []).length === 0 ? <p className="muted">Aucun produit. Créez-en dans « Produits ».</p> : (
          <ActionForm action={saveCategoryProducts} submit="Enregistrer la sélection" className="cat-picks">
            <input type="hidden" name="id" value={c.id} />
            {(products ?? []).map((p) => (
              <div className="cat-pick" key={p.id}>
                <label className="field check">
                  <input type="checkbox" name={`sel_${p.id}`} defaultChecked={sel.has(p.id)} />
                  <span>{p.name} {!p.is_published && <em className="muted small">(masqué : invisible tant qu'il n'est pas publié)</em>}</span>
                </label>
              </div>
            ))}
          </ActionForm>
        )}
      </div>

      <h2>Ordre d'affichage dans cette catégorie</h2>
      <div className="box">
        {ranked.length === 0 ? <p className="muted">Cochez d'abord des articles ci-dessus, puis enregistrez la sélection.</p> : (
          <>
            <p className="muted small">Utilisez les flèches : le changement est enregistré tout de suite. L'ordre ne concerne que cette catégorie.</p>
            {ranked.map((p, i) => (
              <div className="cat-pick" key={p.id}>
                <span>{i + 1}. {p.name} {!p.is_published && <em className="muted small">(masqué)</em>}</span>
                <span className="move">
                  {[['up', '▲', 'Monter'], ['down', '▼', 'Descendre']].map(([dir, sym, lab]) => (
                    <form action={moveCategoryProduct} key={dir}>
                      <input type="hidden" name="category_id" value={c.id} /><input type="hidden" name="product_id" value={p.id} /><input type="hidden" name="dir" value={dir} />
                      <button type="submit" className="btn btn-sm btn-ghost" aria-label={`${lab} ${p.name}`} disabled={(dir === 'up' && i === 0) || (dir === 'down' && i === ranked.length - 1)}>{sym}</button>
                    </form>
                  ))}
                </span>
              </div>
            ))}
          </>
        )}
      </div>

      <h2>Supprimer</h2>
      <div className="box">
        <ActionForm action={deleteCategory} submit="Supprimer la catégorie" danger confirm="Supprimer cette catégorie ? Les produits ne sont pas supprimés.">
          <input type="hidden" name="id" value={c.id} />
          <p className="muted small">Les produits eux-mêmes ne sont pas touchés.</p>
        </ActionForm>
      </div>
    </>
  );
}
