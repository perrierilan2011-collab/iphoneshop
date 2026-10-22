import { createClient } from '@supabase/supabase-js';
import type { Category, Illustration, Product, Settings } from './types';

export const PRODUCT_SELECT = '*, product_colors(*), product_storage(*), variant_links(*), product_images(*)';

/** Client anonyme : la RLS ne laisse passer que les données publiques. */
export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shape(raw: any, enabledOnly: boolean): Product {
  const { product_colors, product_storage, variant_links, product_images, ...rest } = raw;
  type Row = { id: string; display_order: number; is_enabled: boolean };
  const sorted = (a: Row[] | null): Row[] => [...(a ?? [])].sort((x, y) => x.display_order - y.display_order);
  const colors = sorted(product_colors).filter((c) => !enabledOnly || c.is_enabled);
  const storages = sorted(product_storage).filter((s) => !enabledOnly || s.is_enabled);
  const links = (variant_links ?? []).filter(
    (l: { color_id: string; storage_id: string }) =>
      colors.some((c) => c.id === l.color_id) && storages.some((s) => s.id === l.storage_id),
  );
  const images = [...(product_images ?? [])]
    .filter((i: { color_id: string | null }) => i.color_id === null || colors.some((c) => c.id === i.color_id))
    .sort((x: { display_order: number }, y: { display_order: number }) => x.display_order - y.display_order);
  return { ...rest, images, card_display: rest.card_display === 'image' ? 'image' : 'model', card_image_url: rest.card_image_url ?? null, rotate_speed: Number(rest.rotate_speed), model_scale: Number(rest.model_scale),
    model_rot_x: Number(rest.model_rot_x ?? 0), model_rot_y: Number(rest.model_rot_y ?? 0), model_rot_z: Number(rest.model_rot_z ?? 0),
    rotate_reverse: Boolean(rest.rotate_reverse),
    image_zoom_enabled: rest.image_zoom_enabled ?? true, image_zoom_level: Number(rest.image_zoom_level ?? 2.5), colors, storages, links } as Product;
}

export async function getSettings(): Promise<Settings> {
  const { data, error } = await publicClient().from('site_settings').select('*').eq('id', 1).single();
  if (error || !data) throw new Error(`Paramètres du site introuvables : ${error?.message ?? 'aucune ligne'}`);
  return data as Settings;
}

export async function getHomeProducts(limit: number): Promise<Product[]> {
  const { data, error } = await publicClient().from('products').select(PRODUCT_SELECT)
    .eq('is_published', true).eq('show_on_home', true).order('display_order').limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []).map((r) => shape(r, true));
}

export async function getProductBySlug(slug: string): Promise<Product | null> {
  const { data, error } = await publicClient().from('products').select(PRODUCT_SELECT)
    .eq('slug', slug).eq('is_published', true).maybeSingle();
  if (error) throw new Error(error.message);
  return data ? shape(data, true) : null;
}

/** Catégories publiées pour le menu. Si la migration 0005 n'est pas encore passée, le menu reste simplement vide. */
export async function getNavCategories(): Promise<Pick<Category, 'id' | 'name' | 'slug'>[]> {
  const { data, error } = await publicClient().from('categories').select('id,name,slug')
    .eq('is_published', true).order('display_order');
  if (error) return [];
  return data ?? [];
}

export async function getCategoryWithProducts(slug: string): Promise<{ category: Category; products: Product[] } | null> {
  const sb = publicClient();
  const { data: category, error } = await sb.from('categories').select('*').eq('slug', slug).eq('is_published', true).maybeSingle();
  if (error || !category) return null;
  const { data: links } = await sb.from('category_products').select('product_id,display_order').eq('category_id', category.id);
  const ids = (links ?? []).map((l) => l.product_id as string);
  if (ids.length === 0) return { category: category as Category, products: [] };
  const { data: rows, error: e2 } = await sb.from('products').select(PRODUCT_SELECT).in('id', ids).eq('is_published', true);
  if (e2) throw new Error(e2.message);
  const order = new Map((links ?? []).map((l) => [l.product_id as string, l.display_order as number]));
  const products = (rows ?? []).map((r) => shape(r, true)).sort((a, b) => (order.get(a.id) ?? 0) - (order.get(b.id) ?? 0));
  return { category: category as Category, products };
}

/**
 * Illustrations publiées d'une page. Renvoie null si la table n'existe pas encore
 * (migration 0008 non exécutée) : l'appelant peut alors garder l'affichage historique.
 */
export async function getIllustrations(page: 'home' | 'product' | 'category', targetId?: string): Promise<Illustration[] | null> {
  let q = publicClient().from('illustrations').select('*').eq('page', page).eq('is_published', true);
  if (page === 'product') q = q.eq('product_id', targetId ?? '');
  if (page === 'category') q = q.eq('category_id', targetId ?? '');
  const { data, error } = await q.order('display_order').order('created_at');
  if (error) return null;
  return (data ?? []) as Illustration[];
}
