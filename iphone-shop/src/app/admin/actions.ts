'use server';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { requireAdmin } from '@/lib/auth';
import { isSafeHttpsUrl } from '@/lib/pricing';
import { serviceClient } from '@/lib/supabase/service';
import { supabaseServer } from '@/lib/supabase/server';
import type { State } from '@/lib/types';
import * as v from '@/lib/validation';

const s = (fd: FormData, k: string) => String(fd.get(k) ?? '');
const b = (fd: FormData, k: string) => fd.get(k) === 'on';
const db = () => serviceClient();

class UserError extends Error {}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function must(res: { error: any }) {
  if (res.error) {
    if (res.error.code === '23505') throw new UserError('Cette valeur existe déjà (par exemple un slug déjà utilisé).');
    if (res.error.code === '23514') throw new UserError('Une valeur est refusée par la base (prix négatif, couleur invalide…).');
    console.error('[admin]', res.error);
    throw new Error(res.error.message);
  }
}

/** Vérifie l'admin, exécute, invalide le cache public. Le succès n'est annoncé que si tout a réussi. */
async function guard(fn: () => Promise<string>): Promise<State> {
  await requireAdmin();
  try {
    const message = await fn();
    revalidatePath('/', 'layout');
    return { ok: true, message };
  } catch (e) {
    if (e instanceof z.ZodError) return { ok: false, message: e.issues[0]?.message ?? 'Données invalides.' };
    if (e instanceof UserError) return { ok: false, message: e.message };
    return { ok: false, message: "L'enregistrement a échoué. Aucune modification n'a été confirmée." };
  }
}

/* ---------- Session ---------- */
export async function login(_: State, fd: FormData): Promise<State> {
  const email = s(fd, 'email').trim();
  const password = s(fd, 'password');
  const fail: State = { ok: false, message: 'Identifiants incorrects.' };
  if (!email || !password) return fail;
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword({ email, password });
  if (error || !data.user) return fail;
  const { data: admin } = await db().from('admin_users').select('user_id').eq('user_id', data.user.id).maybeSingle();
  if (!admin) { await sb.auth.signOut(); return fail; } // même message : on ne révèle pas si le compte existe
  redirect('/admin');
}

export async function logout() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/admin/login');
}

export async function changePassword(_: State, fd: FormData): Promise<State> {
  await requireAdmin();
  const pwd = s(fd, 'password');
  if (pwd.length < 12) return { ok: false, message: 'Le mot de passe doit contenir au moins 12 caractères.' };
  if (pwd !== s(fd, 'confirm')) return { ok: false, message: 'Les deux mots de passe ne correspondent pas.' };
  const { error } = await (await supabaseServer()).auth.updateUser({ password: pwd });
  return error ? { ok: false, message: 'Changement impossible. Reconnectez-vous puis réessayez.' } : { ok: true, message: 'Mot de passe modifié.' };
}

/* ---------- Paramètres du site ---------- */
export async function saveSettings(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const nav = [0, 1, 2, 3, 4, 5]
      .map((i) => ({ label: s(fd, `nav_label_${i}`), href: s(fd, `nav_href_${i}`), enabled: b(fd, `nav_enabled_${i}`) }))
      .filter((l) => l.label.trim() !== '' || l.href.trim() !== '');
    const d = v.settings.parse({
      site_name: s(fd, 'site_name'), slogan: s(fd, 'slogan'), logo_url: s(fd, 'logo_url'),
      homepage_title: s(fd, 'homepage_title'), homepage_subtitle: s(fd, 'homepage_subtitle'),
      homepage_description: s(fd, 'homepage_description'), home_show_intro: b(fd, 'home_show_intro'),
      products_heading: s(fd, 'products_heading'), home_max_products: s(fd, 'home_max_products'),
      meta_description: s(fd, 'meta_description'), discover_label: s(fd, 'discover_label'), buy_label: s(fd, 'buy_label'),
      footer_text: s(fd, 'footer_text'), contact_email: s(fd, 'contact_email'),
      accent_color: s(fd, 'accent_color'), background_color: s(fd, 'background_color'),
      card_color: s(fd, 'card_color'), text_color: s(fd, 'text_color'),
      border_radius_px: s(fd, 'border_radius_px'), animations_enabled: b(fd, 'animations_enabled'), nav_links: nav,
    });
    must(await db().from('site_settings').update(d).eq('id', 1));
    return 'Paramètres enregistrés. Le site public est à jour.';
  });
}

/* ---------- Produits ---------- */
export async function createProduct(_: State, fd: FormData): Promise<State> {
  let newId = '';
  const r = await guard(async () => {
    const nm = v.name.parse(s(fd, 'name'));
    const sl = v.slug.parse(v.slugify(nm));
    const { data: last } = await db().from('products').select('display_order').order('display_order', { ascending: false }).limit(1);
    const { data, error } = await db().from('products')
      .insert({ name: nm, slug: sl, display_order: (last?.[0]?.display_order ?? -1) + 1, is_published: false }).select('id').single();
    must({ error });
    newId = data!.id;
    return 'Produit créé.';
  });
  if (r.ok) redirect(`/admin/products/${newId}`);
  return r;
}

export async function saveProduct(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const d = v.product.parse({
      id: s(fd, 'id'), name: s(fd, 'name'), slug: s(fd, 'slug'), description: s(fd, 'description'),
      extra_info: s(fd, 'extra_info'), badge: s(fd, 'badge'), main_image_url: s(fd, 'main_image_url'),
      model_3d_url: s(fd, 'model_3d_url'), purchase_url: s(fd, 'purchase_url'),
      purchase_button_text: s(fd, 'purchase_button_text'), purchase_enabled: b(fd, 'purchase_enabled'),
      append_config_params: b(fd, 'append_config_params'), is_published: b(fd, 'is_published'),
      show_on_home: b(fd, 'show_on_home'), display_order: s(fd, 'display_order'),
      auto_rotate: b(fd, 'auto_rotate'), rotate_speed: s(fd, 'rotate_speed'), zoom_enabled: b(fd, 'zoom_enabled'),
      image_zoom_enabled: b(fd, 'image_zoom_enabled'), image_zoom_level: s(fd, 'image_zoom_level') || '2.5',
      model_scale: s(fd, 'model_scale'), is_demo_data: b(fd, 'is_demo_data'),
      model_rot_x: s(fd, 'model_rot_x') || '0', model_rot_y: s(fd, 'model_rot_y') || '0', model_rot_z: s(fd, 'model_rot_z') || '0',
      rotate_reverse: b(fd, 'rotate_reverse'),
    });
    const { id, ...rest } = d;
    must(await db().from('products').update(rest).eq('id', id));
    return 'Produit enregistré.';
  });
}

export async function deleteProduct(_: State, fd: FormData): Promise<State> {
  const r = await guard(async () => {
    must(await db().from('products').delete().eq('id', v.uuid.parse(s(fd, 'id'))));
    return 'Produit supprimé.';
  });
  if (r.ok) redirect('/admin/products');
  return r;
}

/* ---------- Catégories du menu ---------- */
export async function createCategory(_: State, fd: FormData): Promise<State> {
  let newId = '';
  const r = await guard(async () => {
    const nm = v.category.shape.name.parse(s(fd, 'name'));
    const sl = v.slug.parse(v.slugify(nm));
    const { data: last } = await db().from('categories').select('display_order').order('display_order', { ascending: false }).limit(1);
    const { data, error } = await db().from('categories')
      .insert({ name: nm, slug: sl, display_order: (last?.[0]?.display_order ?? -1) + 1, is_published: false }).select('id').single();
    must({ error });
    newId = data!.id;
    return 'Catégorie créée.';
  });
  if (r.ok) redirect(`/admin/categories/${newId}`);
  return r;
}

export async function saveCategory(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const d = v.category.parse({
      id: s(fd, 'id'), name: s(fd, 'name'), slug: s(fd, 'slug'), title: s(fd, 'title'),
      description: s(fd, 'description'), is_published: b(fd, 'is_published'), display_order: s(fd, 'display_order'),
    });
    v.slug.parse(d.slug); // refuse les slugs réservés
    const { id, ...rest } = d;
    must(await db().from('categories').update(rest).eq('id', id));
    return 'Catégorie enregistrée.';
  });
}

export async function deleteCategory(_: State, fd: FormData): Promise<State> {
  const r = await guard(async () => {
    must(await db().from('categories').delete().eq('id', v.uuid.parse(s(fd, 'id'))));
    return 'Catégorie supprimée.';
  });
  if (r.ok) redirect('/admin/categories');
  return r;
}

/** Remplace la sélection d'articles de la catégorie : cases cochées (sel_<id>) + ordre (ord_<id>). */
export async function saveCategoryProducts(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const categoryId = v.uuid.parse(s(fd, 'id'));
    const rows = [...fd.keys()]
      .filter((k) => k.startsWith('sel_'))
      .map((k) => {
        const productId = v.uuid.parse(k.slice(4));
        return { category_id: categoryId, product_id: productId, display_order: v.order.parse(s(fd, `ord_${productId}`) || '0') };
      });
    must(await db().from('category_products').delete().eq('category_id', categoryId));
    if (rows.length > 0) must(await db().from('category_products').insert(rows));
    return `${rows.length} article(s) dans cette catégorie.`;
  });
}

/* ---------- Couleurs ---------- */
export async function addColor(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const pid = v.uuid.parse(s(fd, 'product_id'));
    const { count } = await db().from('product_colors').select('id', { count: 'exact', head: true }).eq('product_id', pid);
    const d = z.object({ name: z.string().trim().min(1, 'Nom de couleur obligatoire.').max(40), hex_code: v.hex })
      .parse({ name: s(fd, 'name'), hex_code: s(fd, 'hex_code') });
    must(await db().from('product_colors').insert({ ...d, product_id: pid, display_order: count ?? 0, is_default: (count ?? 0) === 0 }));
    return 'Couleur ajoutée.';
  });
}

export async function saveColor(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const d = v.color.parse({
      id: s(fd, 'id'), product_id: s(fd, 'product_id'), name: s(fd, 'name'), hex_code: s(fd, 'hex_code'),
      image_url: s(fd, 'image_url'), model_3d_url: s(fd, 'model_3d_url'), purchase_url: s(fd, 'purchase_url'),
      is_enabled: b(fd, 'is_enabled'), is_default: b(fd, 'is_default'), display_order: s(fd, 'display_order'),
      rotation_locked: b(fd, 'rotation_locked'),
    });
    const { id, ...rest } = d;
    if (rest.is_default) must(await db().from('product_colors').update({ is_default: false }).eq('product_id', rest.product_id).neq('id', id));
    must(await db().from('product_colors').update(rest).eq('id', id));
    return 'Couleur enregistrée.';
  });
}

export async function deleteColor(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    must(await db().from('product_colors').delete().eq('id', v.uuid.parse(s(fd, 'id'))));
    return 'Couleur supprimée.';
  });
}

/* ---------- Stockages et prix ---------- */
export async function addStorage(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const pid = v.uuid.parse(s(fd, 'product_id'));
    const { count } = await db().from('product_storage').select('id', { count: 'exact', head: true }).eq('product_id', pid);
    const d = z.object({
      label: z.string().trim().min(1, 'Libellé obligatoire.').max(20),
      capacity_value: z.coerce.number().int().min(0).max(100000), price_in_cents: v.priceCents,
    }).parse({ label: s(fd, 'label'), capacity_value: s(fd, 'capacity_value'), price_in_cents: s(fd, 'price') });
    must(await db().from('product_storage').insert({ ...d, product_id: pid, display_order: count ?? 0, is_default: (count ?? 0) === 0 }));
    return 'Stockage ajouté.';
  });
}

export async function saveStorage(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const d = v.storage.parse({
      id: s(fd, 'id'), product_id: s(fd, 'product_id'), label: s(fd, 'label'), capacity_value: s(fd, 'capacity_value'),
      price_in_cents: s(fd, 'price'), purchase_url: s(fd, 'purchase_url'),
      is_enabled: b(fd, 'is_enabled'), is_default: b(fd, 'is_default'), display_order: s(fd, 'display_order'),
    });
    const { id, ...rest } = d;
    if (rest.is_default) must(await db().from('product_storage').update({ is_default: false }).eq('product_id', rest.product_id).neq('id', id));
    must(await db().from('product_storage').update(rest).eq('id', id));
    return 'Stockage enregistré.';
  });
}

export async function deleteStorage(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    must(await db().from('product_storage').delete().eq('id', v.uuid.parse(s(fd, 'id'))));
    return 'Stockage supprimé.';
  });
}

/* ---------- Liens couleur + stockage ---------- */
export async function saveVariantLink(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    const d = z.object({ product_id: v.uuid, color_id: v.uuid, storage_id: v.uuid, purchase_url: v.optUrl })
      .parse({ product_id: s(fd, 'product_id'), color_id: s(fd, 'color_id'), storage_id: s(fd, 'storage_id'), purchase_url: s(fd, 'purchase_url') });
    const [c, st] = await Promise.all([
      db().from('product_colors').select('product_id').eq('id', d.color_id).maybeSingle(),
      db().from('product_storage').select('product_id').eq('id', d.storage_id).maybeSingle(),
    ]);
    if (c.data?.product_id !== d.product_id || st.data?.product_id !== d.product_id) throw new UserError('Cette couleur ou ce stockage n\'appartient pas à ce produit.');
    if (!d.purchase_url || !isSafeHttpsUrl(d.purchase_url)) throw new UserError('URL HTTPS obligatoire.');
    must(await db().from('variant_links').upsert(d, { onConflict: 'color_id,storage_id' }));
    return 'Lien enregistré.';
  });
}

export async function deleteVariantLink(_: State, fd: FormData): Promise<State> {
  return guard(async () => {
    must(await db().from('variant_links').delete().eq('id', v.uuid.parse(s(fd, 'id'))));
    return 'Lien supprimé.';
  });
}

/* ---------- Envoi de fichiers (images / modèles 3D) ---------- */
const UPLOAD_RULES = {
  image: { exts: ['png', 'jpg', 'jpeg', 'webp', 'gif', 'avif'], maxBytes: 10 * 1024 * 1024, label: '10 Mo' },
  model: { exts: ['glb', 'gltf'], maxBytes: 50 * 1024 * 1024, label: '50 Mo' },
} as const;

export type UploadResult =
  | { ok: true; path: string; token: string; publicUrl: string }
  | { ok: false; message: string };

/** Délivre un jeton d'envoi à usage unique. Réservé aux administrateurs ; le fichier part ensuite directement vers Supabase. */
export async function createUpload(kind: 'image' | 'model', fileName: string, size: number): Promise<UploadResult> {
  await requireAdmin();
  const rule = UPLOAD_RULES[kind];
  if (!rule) return { ok: false, message: 'Type de fichier inconnu.' };
  const ext = (fileName.split('.').pop() ?? '').toLowerCase();
  if (!(rule.exts as readonly string[]).includes(ext)) {
    return { ok: false, message: `Format refusé. Formats acceptés : ${rule.exts.join(', ')}.` };
  }
  if (!Number.isFinite(size) || size <= 0 || size > rule.maxBytes) {
    return { ok: false, message: `Fichier trop volumineux (${rule.label} maximum).` };
  }
  const path = `${kind === 'image' ? 'images' : 'models'}/${crypto.randomUUID()}.${ext}`;
  const bucket = db().storage.from('media');
  const { data, error } = await bucket.createSignedUploadUrl(path);
  if (error || !data) {
    console.error('[admin] upload', error);
    return { ok: false, message: "Impossible de préparer l'envoi. Vérifiez que le bucket « media » existe dans Supabase." };
  }
  return { ok: true, path, token: data.token, publicUrl: bucket.getPublicUrl(path).data.publicUrl };
}

/* ---------- Création / réinitialisation de l'administrateur via les variables Vercel ---------- */
export async function setupAdmin(): Promise<State> {
  const email = process.env.ADMIN_EMAIL?.trim();
  const password = process.env.ADMIN_PASSWORD;
  if (!email || !password) return { ok: false, message: 'Variables ADMIN_EMAIL et ADMIN_PASSWORD absentes.' };
  if (password.length < 12) return { ok: false, message: 'Le mot de passe doit contenir au moins 12 caractères.' };
  try {
    const sb = db();
    let userId: string;
    const created = await sb.auth.admin.createUser({ email, password, email_confirm: true });
    if (created.data.user) {
      userId = created.data.user.id;
    } else {
      const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
      const existing = list.data?.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
      if (!existing) throw new Error(created.error?.message ?? 'Création impossible.');
      userId = existing.id;
      const upd = await sb.auth.admin.updateUserById(userId, { password });
      if (upd.error) throw new Error(upd.error.message);
    }
    must(await sb.from('admin_users').upsert({ user_id: userId }));
    return { ok: true, message: 'Compte prêt. Vous pouvez vous connecter. Supprimez ensuite ADMIN_EMAIL et ADMIN_PASSWORD dans Vercel.' };
  } catch (e) {
    console.error('[admin setup]', e instanceof Error ? e.message : e);
    return { ok: false, message: "Échec. Vérifiez l'adresse e-mail, le mot de passe (12 caractères minimum) et les journaux Vercel." };
  }
}
