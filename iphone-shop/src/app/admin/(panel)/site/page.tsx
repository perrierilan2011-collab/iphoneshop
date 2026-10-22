import ActionForm from '@/components/admin/ActionForm';
import { Check, Field } from '@/components/admin/Field';
import UploadField from '@/components/admin/UploadField';
import { serviceClient } from '@/lib/supabase/service';
import type { Settings } from '@/lib/types';
import { saveSettings } from '../../actions';

export default async function SitePage() {
  const { data } = await serviceClient().from('site_settings').select('*').eq('id', 1).single();
  const s = data as Settings & { updated_at: string };
  const nav = [...s.nav_links];
  while (nav.length < 6) nav.push({ label: '', href: '', enabled: false });
  const t = (name: string, label: string, value: string | null, extra?: { hint?: string; max?: number }) => (
    <Field label={label} hint={extra?.hint}><input name={name} defaultValue={value ?? ''} maxLength={extra?.max} /></Field>
  );
  return (
    <>
      <h1>Personnalisation du site</h1>
      <ActionForm key={s.updated_at} action={saveSettings} submit="Enregistrer et publier" className="">
        <h2>Identité</h2>
        <div className="box grid">
          <Field label="Nom du site"><input name="site_name" defaultValue={s.site_name} required maxLength={60} /></Field>
          {t('slogan', 'Slogan', s.slogan, { max: 120 })}
          <UploadField name="logo_url" label="Logo" kind="image" defaultValue={s.logo_url} hint="Sans logo, le nom du site est affiché." />
          <Field label="Description pour les moteurs de recherche"><input name="meta_description" defaultValue={s.meta_description ?? ''} maxLength={300} /></Field>
        </div>
        <h2>Page d'accueil</h2>
        <div className="box grid">
          {t('homepage_title', 'Titre principal', s.homepage_title, { max: 120 })}
          {t('homepage_subtitle', 'Sous-titre', s.homepage_subtitle, { max: 200 })}
          <Field label="Texte d'introduction"><textarea name="homepage_description" defaultValue={s.homepage_description ?? ''} maxLength={600} /></Field>
          <Check name="home_show_intro" label="Afficher le texte d'introduction" checked={s.home_show_intro} />
          {t('products_heading', 'Titre de la vitrine', s.products_heading, { max: 80 })}
          <Field label="Nombre de produits visibles"><input type="number" name="home_max_products" min={1} max={48} defaultValue={s.home_max_products} /></Field>
        </div>
        <h2>Boutons</h2>
        <div className="box grid">
          {t('discover_label', 'Texte du bouton Découvrir', s.discover_label, { max: 30 })}
          {t('buy_label', 'Texte du bouton Acheter', s.buy_label, { hint: 'Valeur par défaut, remplaçable par produit.', max: 30 })}
        </div>
        <h2>Design</h2>
        <div className="box grid">
          <Field label="Couleur d'accent"><input type="color" name="accent_color" defaultValue={s.accent_color} /></Field>
          <Field label="Couleur du fond"><input type="color" name="background_color" defaultValue={s.background_color} /></Field>
          <Field label="Couleur des cartes"><input type="color" name="card_color" defaultValue={s.card_color} /></Field>
          <Field label="Couleur du texte"><input type="color" name="text_color" defaultValue={s.text_color} /></Field>
          <Field label="Rayon des bordures (px)"><input type="number" name="border_radius_px" min={0} max={32} defaultValue={s.border_radius_px} /></Field>
          <Check name="animations_enabled" label="Activer les animations" checked={s.animations_enabled} />
        </div>
        <h2>Navigation</h2>
        <div className="box">
          <p className="hint" style={{ marginBottom: 12 }}>L'ordre des lignes est l'ordre d'affichage. Lien : chemin interne (/ ou /#iphone), adresse HTTPS ou mailto:. Ligne vide : ignorée.</p>
          {nav.map((l, i) => (
            <div className="grid" key={i} style={{ marginBottom: 10 }}>
              <Field label={`Libellé ${i + 1}`}><input name={`nav_label_${i}`} defaultValue={l.label} maxLength={30} /></Field>
              <Field label="Lien"><input name={`nav_href_${i}`} defaultValue={l.href} maxLength={300} /></Field>
              <Check name={`nav_enabled_${i}`} label="Affiché" checked={l.enabled} />
            </div>
          ))}
        </div>
        <h2>Pied de page</h2>
        <div className="box grid">
          {t('footer_text', 'Texte', s.footer_text, { max: 300 })}
          {t('contact_email', 'E-mail de contact', s.contact_email, { hint: 'Vide : non affiché.', max: 120 })}
        </div>
      </ActionForm>
    </>
  );
}
