import { describe, expect, it } from 'vitest';
import { centsToInput, eurosToCents, formatPrice, isSafeHttpsUrl, pickDefaults, resolvePurchaseUrl, startingPrice } from '@/lib/pricing';
import * as v from '@/lib/validation';
import type { Color, Product, Storage } from '@/lib/types';

const color = (o: Partial<Color> = {}): Color => ({ id: 'c1', product_id: 'p', name: 'Noir', hex_code: '#000000', image_url: null, model_3d_url: null, purchase_url: null, is_enabled: true, is_default: false, display_order: 0, updated_at: '', ...o });
const storage = (o: Partial<Storage> = {}): Storage => ({ id: 's1', product_id: 'p', label: '256 Go', capacity_value: 256, price_in_cents: 99900, purchase_url: null, is_enabled: true, is_default: false, display_order: 0, updated_at: '', ...o });
const product = (o: Partial<Product> = {}): Product => ({
  id: 'p', name: 'iPhone', slug: 'iphone', description: null, extra_info: null, badge: null, main_image_url: null, model_3d_url: null,
  purchase_url: 'https://shop.example/produit', purchase_button_text: null, purchase_enabled: true, append_config_params: false,
  is_published: true, show_on_home: true, display_order: 0, auto_rotate: true, rotate_speed: 1, zoom_enabled: true, model_scale: 1, model_rot_x: 0, model_rot_y: 0, model_rot_z: 0, rotate_reverse: false,
  is_demo_data: false, created_at: '', updated_at: '', colors: [], storages: [], links: [], ...o,
});

describe('prix', () => {
  it('convertit en centimes sans flottants', () => {
    expect(eurosToCents('999')).toBe(99900);
    expect(eurosToCents('999,5')).toBe(99950);
    expect(eurosToCents('1 199.00')).toBe(119900);
    expect(eurosToCents('0,07')).toBe(7);
  });
  it('refuse les valeurs négatives ou invalides', () => {
    for (const bad of ['-5', 'abc', '', '9,999', '1e5']) expect(eurosToCents(bad)).toBeNull();
  });
  it('formate et re-saisit', () => {
    expect(formatPrice(99900).replace(/\s/g, ' ')).toBe('999,00 €');
    expect(centsToInput(119905)).toBe('1199,05');
  });
  it('calcule le prix de départ sur les stockages actifs uniquement', () => {
    const p = product({ storages: [storage({ id: 'a', price_in_cents: 89900, is_enabled: false }), storage({ id: 'b', price_in_cents: 99900 })] });
    expect(startingPrice(p)).toBe(99900);
    expect(startingPrice(product())).toBeNull();
  });
});

describe('liens d\'achat', () => {
  it('accepte uniquement HTTPS', () => {
    expect(isSafeHttpsUrl('https://a.fr/x')).toBe(true);
    for (const bad of ['http://a.fr', 'javascript:alert(1)', 'data:text/html,x', 'https://u:p@a.fr', 'a.fr', '']) expect(isSafeHttpsUrl(bad)).toBe(false);
  });
  it('applique la priorité combinaison > stockage > couleur > produit', () => {
    const c = color({ purchase_url: 'https://shop.example/couleur' });
    const s = storage({ purchase_url: 'https://shop.example/stockage' });
    const link = { id: 'l', product_id: 'p', color_id: 'c1', storage_id: 's1', purchase_url: 'https://shop.example/combo', updated_at: '' };
    expect(resolvePurchaseUrl(product({ links: [link] }), c, s)).toBe('https://shop.example/combo');
    expect(resolvePurchaseUrl(product(), c, s)).toBe('https://shop.example/stockage');
    expect(resolvePurchaseUrl(product(), c, storage())).toBe('https://shop.example/couleur');
    expect(resolvePurchaseUrl(product(), color(), storage())).toBe('https://shop.example/produit');
  });
  it('ignore un lien dangereux et passe au suivant', () => {
    expect(resolvePurchaseUrl(product(), color(), storage({ purchase_url: 'javascript:alert(1)' }))).toBe('https://shop.example/produit');
  });
  it('désactive le bouton sans lien, bouton coupé ou variante désactivée', () => {
    expect(resolvePurchaseUrl(product({ purchase_url: null }), color(), storage())).toBeNull();
    expect(resolvePurchaseUrl(product({ purchase_enabled: false }), color(), storage())).toBeNull();
    expect(resolvePurchaseUrl(product(), color(), storage({ is_enabled: false }))).toBeNull();
    expect(resolvePurchaseUrl(product(), color({ is_enabled: false }), storage())).toBeNull();
  });
  it('ajoute les paramètres de configuration si demandé', () => {
    const u = new URL(resolvePurchaseUrl(product({ append_config_params: true }), color(), storage())!);
    expect(u.searchParams.get('color')).toBe('Noir');
    expect(u.searchParams.get('storage')).toBe('256 Go');
  });
});

describe('sélection par défaut', () => {
  it('retombe sur une valeur valide si la couleur par défaut est désactivée', () => {
    const p = product({ colors: [color({ id: 'a', is_default: true, is_enabled: false }), color({ id: 'b' })] });
    expect(pickDefaults(p).color?.id).toBe('b');
  });
});

describe('validation', () => {
  it('slug et couleur', () => {
    expect(v.slug.safeParse('iphone-17-pro').success).toBe(true);
    expect(v.slug.safeParse('admin').success).toBe(false);
    expect(v.slug.safeParse('Mon Slug').success).toBe(false);
    expect(v.hex.safeParse('#1c1c1e').success).toBe(true);
    expect(v.hex.safeParse('red').success).toBe(false);
    expect(v.slugify('iPhone 18 Pro')).toBe('iphone-18-pro');
  });
  it('URL et prix', () => {
    expect(v.optUrl.safeParse('http://x.fr').success).toBe(false);
    expect(v.optUrl.parse('')).toBeNull();
    expect(v.priceCents.safeParse('-1').success).toBe(false);
    expect(v.priceCents.parse('999,00')).toBe(99900);
  });
});
