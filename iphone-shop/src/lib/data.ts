import { createClient } from '@supabase/supabase-js';
import type { Product, Settings } from './types';

export const PRODUCT_SELECT = '*, product_colors(*), product_storage(*), variant_links(*)';

/** Client anonyme : la RLS ne laisse passer que les données publiques. */
export function publicClient() {
  return createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    auth: { persistSession: false, autoRefreshToken: false },
  });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function shape(raw: any, enabledOnly: boolean): Product {
  const { product_colors, product_storage, variant_links, ...rest } = raw;
  type Row = { id: string; display_order: number; is_enabled: boolean };
  const sorted = (a: Row[] | null): Row[] => [...(a ?? [])].sort((x, y) => x.display_order - y.display_order);
  const colors = sorted(product_colors).filter((c) => !enabledOnly || c.is_enabled);
  const storages = sorted(product_storage).filter((s) => !enabledOnly || s.is_enabled);
  const links = (variant_links ?? []).filter(
    (l: { color_id: string; storage_id: string }) =>
      colors.some((c) => c.id === l.color_id) && storages.some((s) => s.id === l.storage_id),
  );
  return { ...rest, rotate_speed: Number(rest.rotate_speed), model_scale: Number(rest.model_scale),
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
