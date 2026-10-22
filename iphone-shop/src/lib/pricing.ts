import type { Color, Product, Storage } from './types';

/** Affichage uniquement. Les calculs et le stockage restent en centimes entiers. */
export function formatPrice(cents: number): string {
  return new Intl.NumberFormat('fr-FR', { style: 'currency', currency: 'EUR' }).format(cents / 100);
}

/** "999", "999,5" ou "999.50" -> centimes entiers, sans nombre flottant. null si invalide. */
export function eurosToCents(input: string): number | null {
  const m = /^(\d{1,7})(?:[.,](\d{1,2}))?$/.exec(input.trim().replace(/\s/g, ''));
  if (!m) return null;
  return parseInt(m[1], 10) * 100 + parseInt((m[2] ?? '').padEnd(2, '0') || '0', 10);
}

export function centsToInput(cents: number): string {
  return `${Math.floor(cents / 100)},${String(cents % 100).padStart(2, '0')}`;
}

export function isSafeHttpsUrl(value: string): boolean {
  try {
    const u = new URL(value);
    return u.protocol === 'https:' && !u.username && !u.password;
  } catch {
    return false;
  }
}

export function startingPrice(p: Pick<Product, 'storages'>): number | null {
  const prices = p.storages.filter((s) => s.is_enabled).map((s) => s.price_in_cents);
  return prices.length ? Math.min(...prices) : null;
}

export function pickDefaults(p: Pick<Product, 'colors' | 'storages'>): { color: Color | undefined; storage: Storage | undefined } {
  const colors = p.colors.filter((c) => c.is_enabled);
  const storages = p.storages.filter((s) => s.is_enabled);
  return {
    color: colors.find((c) => c.is_default) ?? colors[0],
    storage: storages.find((s) => s.is_default) ?? storages[0],
  };
}

/**
 * Priorité : combinaison couleur+stockage > stockage > couleur > produit.
 * Les URL non HTTPS sont ignorées. Retourne null si le bouton doit être désactivé.
 */
export function resolvePurchaseUrl(p: Product, color: Color, storage: Storage): string | null {
  if (!p.purchase_enabled || !color.is_enabled || !storage.is_enabled) return null;
  const combo = p.links.find((l) => l.color_id === color.id && l.storage_id === storage.id)?.purchase_url;
  const found = [combo, storage.purchase_url, color.purchase_url, p.purchase_url].find((u) => u && isSafeHttpsUrl(u));
  if (!found) return null;
  if (!p.append_config_params) return found;
  const u = new URL(found);
  u.searchParams.set('model', p.name);
  u.searchParams.set('color', color.name);
  u.searchParams.set('storage', storage.label);
  return u.toString();
}
