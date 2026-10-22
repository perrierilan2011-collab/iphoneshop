import Link from 'next/link';
import { notFound } from 'next/navigation';
import ActionForm from '@/components/admin/ActionForm';
import { Check, Field } from '@/components/admin/Field';
import UploadField from '@/components/admin/UploadField';
import { PRODUCT_SELECT, shape } from '@/lib/data';
import { centsToInput, formatPrice, startingPrice } from '@/lib/pricing';
import { serviceClient } from '@/lib/supabase/service';
import {
  addColor, addProductImage, addStorage, deleteColor, deleteProduct, deleteProductImage, saveProductImage, deleteStorage, deleteVariantLink,
  saveColor, saveProduct, saveStorage, saveVariantLink,
} from '../../../actions';

export default async function EditProduct({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await serviceClient().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (!data) notFound();
  const p = shape(data, false);
  const price = startingPrice(p);
  const hidden = (name: string, value: string) => <input type="hidden" name={name} value={value} />;

  return (
    <>
      <div className="rowhead">
        <h1>{p.name}</h1>
        <Link className="btn btn-sm btn-ghost" href={`/admin/preview/${p.id}`}>Prévisualiser</Link>
      </div>
      <p className="muted">Prix de départ calculé : {price !== null ? formatPrice(price) : 'aucun stockage actif'} · Adresse publique : /{p.slug}</p>
      {p.is_demo_data && <p className="warn">Ce produit contient des données de démonstration. Modifiez-les puis décochez « Données de démonstration ».</p>}

      <h2>Produit et visualisation 3D</h2>
      <div className="box">
        <ActionForm key={p.updated_at} action={saveProduct} submit="Enregistrer et publier">
          {hidden('id', p.id)}
          <Field label="Nom"><input name="name" defaultValue={p.name} required maxLength={80} /></Field>
          <Field label="Slug (adresse)" hint="Minuscules, chiffres, tirets."><input name="slug" defaultValue={p.slug} required maxLength={80} /></Field>
          <Field label="Badge"><input name="badge" defaultValue={p.badge ?? ''} maxLength={30} /></Field>
          <Field label="Ordre d'affichage"><input type="number" name="display_order" min={0} max={9999} defaultValue={p.display_order} /></Field>
          <Field label="Description"><textarea name="description" defaultValue={p.description ?? ''} maxLength={2000} /></Field>
          <Field label="Informations complémentaires"><textarea name="extra_info" defaultValue={p.extra_info ?? ''} maxLength={3000} /></Field>
          <Field label="Ce que montre la carte de l'écran d'accueil" hint="« Modèle 3D » : le modèle tourne sur la carte (si le produit en a un). « Photo » : la photo choisie ci-dessous.">
            <select name="card_display" defaultValue={p.card_display}>
              <option value="model">Le modèle 3D</option>
              <option value="image">Une photo</option>
            </select>
          </Field>
          <UploadField name="card_image_url" label="Photo de la carte (écran d'accueil)" kind="image" defaultValue={p.card_image_url} hint="Utilisée si « Une photo » est choisi, et à la place du modèle tant qu'il charge. Vide : l'image principale est utilisée." />
          <UploadField name="main_image_url" label="Image principale / de remplacement" kind="image" defaultValue={p.main_image_url} hint="PNG, JPG, WebP, GIF ou AVIF, 10 Mo maximum." />
          <UploadField name="model_3d_url" label="Modèle 3D (.glb recommandé)" kind="model" defaultValue={p.model_3d_url} hint="Sans modèle, l'image est affichée. 50 Mo maximum." />
          <Field label="Vitesse de rotation automatique (0,1 à 10)"><input type="number" step="0.1" min="0.1" max="10" name="rotate_speed" defaultValue={p.rotate_speed} /></Field>
          <Field label="Échelle d'affichage (0,2 à 3)"><input type="number" step="0.05" min="0.2" max="3" name="model_scale" defaultValue={p.model_scale} /></Field>
          <Check name="auto_rotate" label="Rotation automatique" checked={p.auto_rotate} />
          <Check name="rotate_reverse" label="Inverser le sens de la rotation automatique" checked={p.rotate_reverse} />
          <Field label="Orientation du modèle : avant/arrière (axe X, en degrés)" hint="90 = quart de tour. Sert à redresser un modèle couché."><input type="number" step="15" min="-360" max="360" name="model_rot_x" defaultValue={p.model_rot_x} /></Field>
          <Field label="Orientation du modèle : gauche/droite (axe Y, en degrés)" hint="Change la face montrée au départ. 180 = on le retourne."><input type="number" step="15" min="-360" max="360" name="model_rot_y" defaultValue={p.model_rot_y} /></Field>
          <Field label="Orientation du modèle : inclinaison (axe Z, en degrés)" hint="90 = le modèle est couché sur le côté."><input type="number" step="15" min="-360" max="360" name="model_rot_z" defaultValue={p.model_rot_z} /></Field>
          <Check name="zoom_enabled" label="Zoom autorisé sur le modèle 3D (molette)" checked={p.zoom_enabled} />
          <Check name="image_zoom_enabled" label="Zoom sur les photos (clic pour agrandir)" checked={p.image_zoom_enabled} />
          <Field label="Niveau de zoom des photos (1,5 à 5)" hint="2,5 = la photo est agrandie 2,5 fois. Sur la page produit uniquement."><input type="number" step="0.1" min="1.5" max="5" name="image_zoom_level" defaultValue={p.image_zoom_level} /></Field>
          <Field label="Lien d'achat du produit (HTTPS)" hint="Utilisé en dernier recours si aucun lien plus précis n'existe."><input name="purchase_url" defaultValue={p.purchase_url ?? ''} /></Field>
          <Field label="Texte du bouton d'achat" hint="Vide : texte global du site."><input name="purchase_button_text" defaultValue={p.purchase_button_text ?? ''} maxLength={30} /></Field>
          <Check name="purchase_enabled" label="Bouton d'achat actif" checked={p.purchase_enabled} />
          <Check name="append_config_params" label="Ajouter modèle, couleur et stockage aux paramètres du lien" checked={p.append_config_params} />
          <Check name="is_published" label="Publié" checked={p.is_published} />
          <Check name="show_on_home" label="Afficher sur la page d'accueil" checked={p.show_on_home} />
          <Check name="is_demo_data" label="Données de démonstration" checked={p.is_demo_data} />
        </ActionForm>
      </div>

      <h2>Photos de la page produit</h2>
      <p className="muted">Quand le visiteur ouvre l'article, il passe du modèle 3D aux photos avec les flèches. Chaque photo peut être liée à une couleur : le visiteur ne voit que les photos de la couleur qu'il a choisie (plus celles marquées « Toutes les couleurs »).</p>
      {p.images.length === 0 && <p className="muted">Aucune photo. Ajoutez-en une ci-dessous.</p>}
      {p.images.map((im) => (
        <div className="box" key={im.id}>
          <ActionForm key={im.id + im.url + im.display_order + (im.alt ?? '') + (im.color_id ?? '')} action={saveProductImage} submit="Enregistrer">
            {hidden('id', im.id)}{hidden('product_id', p.id)}
            <UploadField name="url" label="Photo" kind="image" defaultValue={im.url} />
            <Field label="Couleur concernée" hint="Cette photo n'apparaît que pour la couleur choisie.">
              <select name="color_id" defaultValue={im.color_id ?? ''}>
                <option value="">Toutes les couleurs</option>
                {p.colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
              </select>
            </Field>
            <Field label="Description (accessibilité)"><input name="alt" defaultValue={im.alt ?? ''} maxLength={120} /></Field>
            <Field label="Ordre" hint="0 s'affiche en premier."><input type="number" name="display_order" min={0} max={9999} defaultValue={im.display_order} /></Field>
          </ActionForm>
          <ActionForm action={deleteProductImage} submit="Supprimer cette photo" danger confirm="Supprimer cette photo ?" className="">{hidden('id', im.id)}</ActionForm>
        </div>
      ))}
      <div className="box">
        <ActionForm key={`add-img-${p.images.length}`} action={addProductImage} submit="Ajouter la photo">
          {hidden('product_id', p.id)}
          <UploadField name="url" label="Nouvelle photo" kind="image" defaultValue={null} hint="Envoyez le fichier, attendez l'aperçu, puis cliquez sur « Ajouter la photo »." />
          <Field label="Couleur concernée" hint="Cette photo n'apparaît que pour la couleur choisie.">
            <select name="color_id" defaultValue="">
              <option value="">Toutes les couleurs</option>
              {p.colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </Field>
          <Field label="Description (accessibilité)"><input name="alt" maxLength={120} /></Field>
        </ActionForm>
      </div>

      <h2>Couleurs</h2>
      {p.colors.length === 0 && <p className="muted">Aucune couleur. Ajoutez-en une ci-dessous.</p>}
      {p.colors.map((c) => (
        <div className="box" key={c.id}>
          <ActionForm key={c.updated_at} action={saveColor} submit="Enregistrer">
            {hidden('id', c.id)}{hidden('product_id', p.id)}
            <Field label="Nom"><input name="name" defaultValue={c.name} required maxLength={40} /></Field>
            <Field label="Couleur"><input type="color" name="hex_code" defaultValue={c.hex_code} /></Field>
            <Field label="Ordre"><input type="number" name="display_order" min={0} defaultValue={c.display_order} /></Field>
            <UploadField name="image_url" label="Image" kind="image" defaultValue={c.image_url} />
            <UploadField name="model_3d_url" label="Modèle 3D" kind="model" defaultValue={c.model_3d_url} />
            <Field label="Lien d'achat (HTTPS)"><input name="purchase_url" defaultValue={c.purchase_url ?? ''} /></Field>
            <Check name="is_enabled" label="Active" checked={c.is_enabled} />
            <Check name="is_default" label="Sélectionnée par défaut" checked={c.is_default} />
            <Check name="rotation_locked" label="Verrouiller la rotation manuelle (le visiteur ne peut pas faire pivoter ce modèle)" checked={c.rotation_locked} />
          </ActionForm>
          <ActionForm action={deleteColor} submit="Supprimer cette couleur" danger confirm={`Supprimer la couleur « ${c.name} » ?`} className="">{hidden('id', c.id)}</ActionForm>
        </div>
      ))}
      <div className="box">
        <ActionForm action={addColor} submit="Ajouter la couleur">
          {hidden('product_id', p.id)}
          <Field label="Nom"><input name="name" required maxLength={40} /></Field>
          <Field label="Couleur"><input type="color" name="hex_code" defaultValue="#1c1c1e" /></Field>
        </ActionForm>
      </div>

      <h2>Stockages et prix</h2>
      {p.storages.length === 0 && <p className="muted">Aucun stockage : la fiche affichera « Prix bientôt disponible ».</p>}
      {p.storages.map((s) => (
        <div className="box" key={s.id}>
          <ActionForm key={s.updated_at} action={saveStorage} submit="Enregistrer">
            {hidden('id', s.id)}{hidden('product_id', p.id)}
            <Field label="Libellé"><input name="label" defaultValue={s.label} required maxLength={20} /></Field>
            <Field label="Capacité en Go" hint="Pour le tri et la cohérence."><input type="number" name="capacity_value" min={0} defaultValue={s.capacity_value} /></Field>
            <Field label="Prix (€)" hint="Exemple : 999,00"><input name="price" defaultValue={centsToInput(s.price_in_cents)} inputMode="decimal" required /></Field>
            <Field label="Ordre"><input type="number" name="display_order" min={0} defaultValue={s.display_order} /></Field>
            <Field label="Lien d'achat (HTTPS)"><input name="purchase_url" defaultValue={s.purchase_url ?? ''} /></Field>
            <Check name="is_enabled" label="Actif" checked={s.is_enabled} />
            <Check name="is_default" label="Sélectionné par défaut" checked={s.is_default} />
          </ActionForm>
          <ActionForm action={deleteStorage} submit="Supprimer ce stockage" danger confirm={`Supprimer « ${s.label} » ?`} className="">{hidden('id', s.id)}</ActionForm>
        </div>
      ))}
      <div className="box">
        <ActionForm action={addStorage} submit="Ajouter le stockage">
          {hidden('product_id', p.id)}
          <Field label="Libellé"><input name="label" required maxLength={20} placeholder="256 Go" /></Field>
          <Field label="Capacité en Go"><input type="number" name="capacity_value" min={0} defaultValue={0} /></Field>
          <Field label="Prix (€)"><input name="price" inputMode="decimal" required placeholder="999,00" /></Field>
        </ActionForm>
      </div>

      <h2>Liens par combinaison couleur et stockage</h2>
      <p className="muted small" style={{ marginBottom: 12 }}>Priorité : combinaison, puis stockage, puis couleur, puis lien du produit.</p>
      {p.links.map((l) => (
        <div className="box rowhead" key={l.id}>
          <span className="small">{p.colors.find((c) => c.id === l.color_id)?.name} + {p.storages.find((s) => s.id === l.storage_id)?.label} : <span className="muted">{l.purchase_url}</span></span>
          <ActionForm action={deleteVariantLink} submit="Supprimer" danger confirm="Supprimer ce lien ?" className="">{hidden('id', l.id)}</ActionForm>
        </div>
      ))}
      {p.colors.length > 0 && p.storages.length > 0 && (
        <div className="box">
          <ActionForm action={saveVariantLink} submit="Enregistrer le lien">
            {hidden('product_id', p.id)}
            <Field label="Couleur"><select name="color_id">{p.colors.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}</select></Field>
            <Field label="Stockage"><select name="storage_id">{p.storages.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select></Field>
            <Field label="URL d'achat (HTTPS)"><input name="purchase_url" required /></Field>
          </ActionForm>
        </div>
      )}

      <h2>Supprimer le produit</h2>
      <div className="box">
        <p className="muted small" style={{ marginBottom: 8 }}>Pour simplement le retirer du site, décochez « Publié » plus haut.</p>
        <ActionForm action={deleteProduct} submit="Supprimer définitivement" danger confirm={`Supprimer définitivement « ${p.name} », ses couleurs et ses stockages ?`} className="">{hidden('id', p.id)}</ActionForm>
      </div>
    </>
  );
}
