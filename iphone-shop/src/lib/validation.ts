import { z } from 'zod';
import { eurosToCents, isSafeHttpsUrl } from './pricing';

export const RESERVED_SLUGS = ['admin', 'api', 'go', 'contact', '_next'];

export function slugify(input: string): string {
  return input.normalize('NFD').replace(/[\u0300-\u036f]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '');
}

export const name = z.string().trim().min(1, 'Le nom est obligatoire.').max(80, 'Nom trop long (80 caractères maximum).');
export const slug = z.string().trim()
  .regex(/^[a-z0-9]+(-[a-z0-9]+)*$/, 'Slug invalide : minuscules, chiffres et tirets uniquement.')
  .max(80)
  .refine((s) => !RESERVED_SLUGS.includes(s), 'Ce slug est réservé.');
export const hex = z.string().trim().regex(/^#[0-9a-fA-F]{6}$/, 'Couleur invalide (format #rrggbb).');
export const uuid = z.string().uuid('Identifiant invalide.');
export const optText = (max: number) =>
  z.string().trim().max(max, `Texte trop long (${max} caractères maximum).`).transform((v) => (v === '' ? null : v));
export const optUrl = z.string().trim().max(2000, 'URL trop longue.')
  .transform((v) => (v === '' ? null : v))
  .refine((v) => v === null || isSafeHttpsUrl(v), 'URL invalide : seul le protocole HTTPS est accepté.');
export const priceCents = z.string().transform((v, ctx) => {
  const c = eurosToCents(v);
  if (c === null) { ctx.addIssue({ code: z.ZodIssueCode.custom, message: 'Prix invalide (exemple : 999,00). Les valeurs négatives sont refusées.' }); return z.NEVER; }
  return c;
});
export const order = z.coerce.number({ invalid_type_error: 'Ordre invalide.' }).int().min(0).max(9999);

const angle = z.coerce.number({ invalid_type_error: 'Angle invalide.' }).min(-360, 'Angle : -360 à 360.').max(360, 'Angle : -360 à 360.');

export const product = z.object({
  id: uuid, name, slug,
  description: optText(2000), extra_info: optText(3000), badge: optText(30),
  main_image_url: optUrl, model_3d_url: optUrl, purchase_url: optUrl,
  purchase_button_text: optText(30),
  purchase_enabled: z.boolean(), append_config_params: z.boolean(),
  is_published: z.boolean(), show_on_home: z.boolean(), display_order: order,
  auto_rotate: z.boolean(),
  rotate_speed: z.coerce.number().min(0.1, 'Vitesse : 0,1 à 10.').max(10, 'Vitesse : 0,1 à 10.'),
  zoom_enabled: z.boolean(),
  model_scale: z.coerce.number().min(0.2, 'Échelle : 0,2 à 3.').max(3, 'Échelle : 0,2 à 3.'),
  model_rot_x: angle, model_rot_y: angle, model_rot_z: angle, rotate_reverse: z.boolean(),
  is_demo_data: z.boolean(),
});

export const color = z.object({
  id: uuid, product_id: uuid,
  name: z.string().trim().min(1, 'Nom de couleur obligatoire.').max(40),
  hex_code: hex, image_url: optUrl, model_3d_url: optUrl, purchase_url: optUrl,
  is_enabled: z.boolean(), is_default: z.boolean(), display_order: order,
});

export const storage = z.object({
  id: uuid, product_id: uuid,
  label: z.string().trim().min(1, 'Libellé obligatoire.').max(20),
  capacity_value: z.coerce.number().int().min(0).max(100000),
  price_in_cents: priceCents, purchase_url: optUrl,
  is_enabled: z.boolean(), is_default: z.boolean(), display_order: order,
});

const navHref = z.string().trim().max(300).refine(
  (h) => /^\/[A-Za-z0-9\-_\/#]*$/.test(h) || isSafeHttpsUrl(h) || /^mailto:[^\s@]+@[^\s@]+$/.test(h),
  'Lien de navigation invalide (chemin interne, HTTPS ou mailto:).',
);
export const navLink = z.object({
  label: z.string().trim().min(1, 'Libellé de lien obligatoire.').max(30),
  href: navHref, enabled: z.boolean(),
});

export const settings = z.object({
  site_name: z.string().trim().min(1, 'Le nom du site est obligatoire.').max(60),
  slogan: optText(120), logo_url: optUrl,
  homepage_title: optText(120), homepage_subtitle: optText(200), homepage_description: optText(600),
  home_show_intro: z.boolean(), products_heading: optText(80),
  home_max_products: z.coerce.number().int().min(1).max(48),
  meta_description: optText(300),
  discover_label: z.string().trim().min(1, 'Texte du bouton Découvrir obligatoire.').max(30),
  buy_label: z.string().trim().min(1, 'Texte du bouton Acheter obligatoire.').max(30),
  footer_text: optText(300),
  contact_email: optText(120).refine((v) => v === null || /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v), 'Adresse e-mail invalide.'),
  accent_color: hex, background_color: hex, card_color: hex, text_color: hex,
  border_radius_px: z.coerce.number().int().min(0).max(32),
  animations_enabled: z.boolean(),
  nav_links: z.array(navLink).max(6),
});
