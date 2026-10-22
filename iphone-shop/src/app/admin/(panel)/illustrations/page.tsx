import ActionForm from '@/components/admin/ActionForm';
import { Check, Field } from '@/components/admin/Field';
import UploadField from '@/components/admin/UploadField';
import { serviceClient } from '@/lib/supabase/service';
import type { Illustration } from '@/lib/types';
import { addIllustration, deleteIllustration, saveIllustration } from '../../actions';

type Opt = { value: string; label: string };

const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;
const POSITIONS: Record<string, string> = { top: 'Haut de la page (sous le titre)', middle: 'Milieu (accueil : entre la liste des produits et « Chaque détail compte »)', bottom: 'Bas de la page' };
const SIZES: Record<string, string> = { large: 'Grande (pleine largeur)', medium: 'Moyenne', small: 'Petite' };

function PlacementFields({ places, value, position, size }: { places: Opt[]; value: string; position: string; size: string }) {
  return (
    <>
      <Field label="Page où l'illustration apparaît">
        <select name="placement" defaultValue={value}>
          {places.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
        </select>
      </Field>
      <Field label="Emplacement sur la page" hint="« Milieu » n'existe que sur l'accueil.">
        <select name="position" defaultValue={position}>
          {Object.entries(POSITIONS).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
      <Field label="Taille">
        <select name="size" defaultValue={size}>
          {Object.entries(SIZES).map(([k, l]) => <option key={k} value={k}>{l}</option>)}
        </select>
      </Field>
    </>
  );
}

export default async function Illustrations() {
  const db = serviceClient();
  const [ill, prods, cats] = await Promise.all([
    db.from('illustrations').select('*').order('page').order('position').order('display_order'),
    db.from('products').select('id,name').order('display_order'),
    db.from('categories').select('id,name').order('display_order'),
  ]);
  if (ill.error) {
    return (
      <>
        <h1>Illustrations</h1>
        <div className="box"><p className="msg err">Table introuvable. Exécutez d'abord <code>supabase/migrations/0008_illustrations.sql</code> une seule fois dans Supabase &gt; SQL Editor.</p></div>
      </>
    );
  }
  const places: Opt[] = [
    { value: 'home', label: 'Accueil' },
    ...(prods.data ?? []).map((p) => ({ value: `product:${p.id}`, label: `Page produit : ${p.name}` })),
    ...(cats.data ?? []).map((c) => ({ value: `category:${c.id}`, label: `Page catégorie : ${c.name}` })),
  ];
  const placeOf = (i: Illustration) => (i.page === 'home' ? 'home' : i.page === 'product' ? `product:${i.product_id}` : `category:${i.category_id}`);
  const list = (ill.data ?? []) as Illustration[];

  return (
    <>
      <h1>Illustrations</h1>
      <p className="muted">
        Ajoutez des images (comme celle en haut de l'accueil) et choisissez la page, l'emplacement et la taille. Plusieurs illustrations au même endroit
        s'affichent l'une sous l'autre, dans l'ordre indiqué. Les changements sont visibles tout de suite sur le site.
      </p>

      <h2>Ajouter une illustration</h2>
      <div className="box">
        <ActionForm key={`add-${list.length}`} action={addIllustration} submit="Ajouter l'illustration">
          <UploadField name="image_url" label="Image" kind="image" defaultValue={null} hint="Envoyez le fichier (10 Mo maximum), attendez l'aperçu, puis cliquez sur « Ajouter l'illustration »." />
          <PlacementFields places={places} value="home" position="top" size="large" />
          <Field label="Description (accessibilité)"><input name="alt" maxLength={120} /></Field>
          <Field label="Légende sous l'image" hint="Facultatif."><input name="caption" maxLength={200} /></Field>
          <Field label="Ordre" hint="0 s'affiche en premier."><input type="number" name="display_order" min={0} max={9999} defaultValue={0} /></Field>
          <Check name="is_published" label="Visible sur le site" checked />
        </ActionForm>
      </div>

      <h2>Illustrations en place</h2>
      {list.length === 0 && <p className="muted">Aucune illustration pour le moment.</p>}
      {list.map((i) => (
        <div className="box" key={i.id}>
          <ActionForm key={i.id + i.updated_at} action={saveIllustration} submit="Enregistrer">
            {hidden('id', i.id)}
            <UploadField name="image_url" label="Image" kind="image" defaultValue={i.image_url} />
            <PlacementFields places={places} value={placeOf(i)} position={i.position} size={i.size} />
            <Field label="Description (accessibilité)"><input name="alt" maxLength={120} defaultValue={i.alt ?? ''} /></Field>
            <Field label="Légende sous l'image"><input name="caption" maxLength={200} defaultValue={i.caption ?? ''} /></Field>
            <Field label="Ordre" hint="0 s'affiche en premier."><input type="number" name="display_order" min={0} max={9999} defaultValue={i.display_order} /></Field>
            <Check name="is_published" label="Visible sur le site" checked={i.is_published} />
          </ActionForm>
          <ActionForm action={deleteIllustration} submit="Supprimer cette illustration" danger confirm="Supprimer cette illustration ?" className="">{hidden('id', i.id)}</ActionForm>
        </div>
      ))}
    </>
  );
}
