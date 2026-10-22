export type State = { ok: boolean | null; message: string };

export type NavLink = { label: string; href: string; enabled: boolean };

export type Settings = {
  site_name: string;
  slogan: string | null;
  logo_url: string | null;
  homepage_title: string | null;
  homepage_subtitle: string | null;
  homepage_description: string | null;
  home_show_intro: boolean;
  products_heading: string | null;
  home_max_products: number;
  meta_description: string | null;
  discover_label: string;
  buy_label: string;
  footer_text: string | null;
  contact_email: string | null;
  accent_color: string;
  background_color: string;
  card_color: string;
  text_color: string;
  border_radius_px: number;
  animations_enabled: boolean;
  nav_links: NavLink[];
};

export type Color = {
  id: string; product_id: string; name: string; hex_code: string;
  image_url: string | null; model_3d_url: string | null; purchase_url: string | null;
  is_enabled: boolean; is_default: boolean; display_order: number; updated_at: string;
  rotation_locked: boolean;
};

export type Storage = {
  id: string; product_id: string; label: string; capacity_value: number; price_in_cents: number;
  purchase_url: string | null; is_enabled: boolean; is_default: boolean; display_order: number; updated_at: string;
};

export type VariantLink = {
  id: string; product_id: string; color_id: string; storage_id: string; purchase_url: string; updated_at: string;
};

export type ProductImage = { id: string; product_id: string; color_id: string | null; url: string; alt: string | null; display_order: number };

export type Product = {
  id: string; name: string; slug: string; description: string | null; extra_info: string | null;
  badge: string | null; main_image_url: string | null; model_3d_url: string | null;
  purchase_url: string | null; purchase_button_text: string | null;
  purchase_enabled: boolean; append_config_params: boolean;
  is_published: boolean; show_on_home: boolean; display_order: number;
  auto_rotate: boolean; rotate_speed: number; zoom_enabled: boolean; image_zoom_enabled: boolean; image_zoom_level: number; model_scale: number;
  model_rot_x: number; model_rot_y: number; model_rot_z: number; rotate_reverse: boolean;
  is_demo_data: boolean; created_at: string; updated_at: string;
  card_display: 'model' | 'image'; card_image_url: string | null;
  colors: Color[]; storages: Storage[]; links: VariantLink[]; images: ProductImage[];
};

export type Category = {
  id: string; name: string; slug: string; title: string | null; description: string | null;
  is_published: boolean; display_order: number; created_at: string; updated_at: string;
};

export type IllustrationPosition = 'top' | 'middle' | 'bottom';
export type IllustrationSize = 'large' | 'medium' | 'small';
export type Illustration = {
  id: string; page: 'home' | 'product' | 'category'; product_id: string | null; category_id: string | null;
  position: IllustrationPosition; size: IllustrationSize; image_url: string; alt: string | null; caption: string | null;
  display_order: number; is_published: boolean; created_at: string; updated_at: string;
};
