import Link from 'next/link';
import ActionForm from '@/components/admin/ActionForm';
import { Field } from '@/components/admin/Field';
import { serviceClient } from '@/lib/supabase/service';
import { createCategory } from '../../actions';

export default async function Categories() {
  const { data, error } = await serviceClient().from('categories').select('*, category_products(product_id)').order('display_order');
  if (error) {
    return (
      <>
        <h1>Catégories du menu</h1>
        <div className="box"><p className="msg err">Table introuvable. Exécutez d'abord <code>supabase/migrations/0005_categories.sql</code> une seule fois dans Supabase &gt; SQL Editor.</p></div>
      </>
    );
  }
  return (
    <>
      <h1>Catégories du menu</h1>
      <p className="muted">Chaque catégorie publiée apparaît dans la barre du haut du site et ouvre sa propre page, avec les articles que vous choisissez ici.</p>
      {(data ?? []).map((c) => (
        <div className="box" key={c.id}>
          <div className="rowhead">
            <div>
              <strong>{c.name}</strong> <span className={c.is_published ? 'status live' : 'status'}>{c.is_published ? 'Publiée' : 'Masquée'}</span>
              <p className="muted small">/categorie/{c.slug} · {c.category_products?.length ?? 0} article(s)</p>
            </div>
            <Link className="btn btn-sm" href={`/admin/categories/${c.id}`}>Modifier</Link>
          </div>
        </div>
      ))}
      <h2>Ajouter une catégorie</h2>
      <div className="box">
        <ActionForm action={createCategory} submit="Créer la catégorie">
          <Field label="Nom" hint="Texte affiché dans le menu, par exemple « iPhone », « Accessoires »."><input name="name" required maxLength={40} /></Field>
        </ActionForm>
      </div>
    </>
  );
}
