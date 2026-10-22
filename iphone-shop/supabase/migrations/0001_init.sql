-- Migration initiale. À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.
-- Le seed final n'insère que les produits absents (par slug) : il ne réécrase jamais vos modifications.

create extension if not exists pgcrypto;

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid());
$$;

create or replace function public.touch_updated_at() returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

create table if not exists public.site_settings (
  id int primary key default 1 check (id = 1),
  site_name text not null default 'XXX' check (char_length(site_name) between 1 and 60),
  slogan text,
  logo_url text,
  homepage_title text,
  homepage_subtitle text,
  homepage_description text,
  home_show_intro boolean not null default true,
  products_heading text,
  home_max_products int not null default 8 check (home_max_products between 1 and 48),
  meta_description text,
  discover_label text not null default 'Découvrir',
  buy_label text not null default 'Acheter',
  footer_text text,
  contact_email text,
  accent_color text not null default '#9db7d5' check (accent_color ~ '^#[0-9a-fA-F]{6}$'),
  background_color text not null default '#0b0b0d' check (background_color ~ '^#[0-9a-fA-F]{6}$'),
  card_color text not null default '#151518' check (card_color ~ '^#[0-9a-fA-F]{6}$'),
  text_color text not null default '#f5f5f7' check (text_color ~ '^#[0-9a-fA-F]{6}$'),
  border_radius_px int not null default 14 check (border_radius_px between 0 and 32),
  animations_enabled boolean not null default true,
  nav_links jsonb not null default '[{"label":"Accueil","href":"/","enabled":true},{"label":"iPhone","href":"/#iphone","enabled":true}]',
  updated_at timestamptz not null default now()
);

create table if not exists public.products (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 80),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  description text,
  extra_info text,
  badge text,
  main_image_url text,
  model_3d_url text,
  purchase_url text,
  purchase_button_text text,
  purchase_enabled boolean not null default true,
  append_config_params boolean not null default false,
  is_published boolean not null default false,
  show_on_home boolean not null default true,
  display_order int not null default 0,
  auto_rotate boolean not null default true,
  rotate_speed numeric(4,1) not null default 1.0 check (rotate_speed between 0.1 and 10),
  zoom_enabled boolean not null default true,
  model_scale numeric(4,2) not null default 1.0 check (model_scale between 0.2 and 3),
  is_demo_data boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists products_order_idx on public.products (display_order);

create table if not exists public.product_colors (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  name text not null check (char_length(name) between 1 and 40),
  hex_code text not null check (hex_code ~ '^#[0-9a-fA-F]{6}$'),
  image_url text,
  model_3d_url text,
  purchase_url text,
  is_enabled boolean not null default true,
  is_default boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_colors_product_idx on public.product_colors (product_id);
create unique index if not exists product_colors_one_default on public.product_colors (product_id) where is_default;

create table if not exists public.product_storage (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  label text not null check (char_length(label) between 1 and 20),
  capacity_value int not null default 0 check (capacity_value >= 0),
  price_in_cents int not null check (price_in_cents >= 0),
  purchase_url text,
  is_enabled boolean not null default true,
  is_default boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_storage_product_idx on public.product_storage (product_id);
create unique index if not exists product_storage_one_default on public.product_storage (product_id) where is_default;

-- Lien d'achat propre à une combinaison couleur + stockage
create table if not exists public.variant_links (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  color_id uuid not null references public.product_colors(id) on delete cascade,
  storage_id uuid not null references public.product_storage(id) on delete cascade,
  purchase_url text not null,
  updated_at timestamptz not null default now(),
  unique (color_id, storage_id)
);
create index if not exists variant_links_product_idx on public.variant_links (product_id);

do $$
declare t text;
begin
  foreach t in array array['site_settings','products','product_colors','product_storage','variant_links'] loop
    execute format('drop trigger if exists touch_%1$s on public.%1$s', t);
    execute format('create trigger touch_%1$s before update on public.%1$s for each row execute function public.touch_updated_at()', t);
  end loop;
end $$;

-- Row Level Security
alter table public.admin_users enable row level security;
alter table public.site_settings enable row level security;
alter table public.products enable row level security;
alter table public.product_colors enable row level security;
alter table public.product_storage enable row level security;
alter table public.variant_links enable row level security;

create policy "admin_users: lecture de sa propre ligne" on public.admin_users for select using (user_id = auth.uid());

create policy "settings: lecture publique" on public.site_settings for select using (true);
create policy "settings: ecriture admin" on public.site_settings for all using (public.is_admin()) with check (public.is_admin());

create policy "products: lecture publique des produits publies" on public.products for select using (is_published);
create policy "products: admin" on public.products for all using (public.is_admin()) with check (public.is_admin());

create policy "colors: lecture publique des couleurs actives" on public.product_colors for select
  using (is_enabled and exists (select 1 from public.products p where p.id = product_id and p.is_published));
create policy "colors: admin" on public.product_colors for all using (public.is_admin()) with check (public.is_admin());

create policy "storage: lecture publique des stockages actifs" on public.product_storage for select
  using (is_enabled and exists (select 1 from public.products p where p.id = product_id and p.is_published));
create policy "storage: admin" on public.product_storage for all using (public.is_admin()) with check (public.is_admin());

create policy "links: lecture publique" on public.variant_links for select
  using (exists (select 1 from public.product_colors c where c.id = color_id and c.is_enabled)
     and exists (select 1 from public.product_storage s where s.id = storage_id and s.is_enabled)
     and exists (select 1 from public.products p where p.id = product_id and p.is_published));
create policy "links: admin" on public.variant_links for all using (public.is_admin()) with check (public.is_admin());

-- Bucket public pour vos images et fichiers GLB (envoi via le tableau de bord Supabase)
insert into storage.buckets (id, name, public) values ('media', 'media', true) on conflict (id) do nothing;

-- Seed idempotent
insert into public.site_settings (id, site_name, slogan, homepage_title, homepage_subtitle, homepage_description, products_heading, footer_text)
values (1, 'XXX', 'Une sélection d''iPhone', 'Choisissez votre iPhone', 'Couleur, stockage, prix : tout est ici.',
        'Données de démonstration : modifiez ces textes depuis l''administration.', 'Les modèles', 'Tous droits réservés.')
on conflict (id) do nothing;

with np as (
  insert into public.products (name, slug, description, badge, is_published, show_on_home, display_order, is_demo_data, extra_info)
  values
    ('iPhone 18',     'iphone-18',     'Description de démonstration, à personnaliser.', 'Nouveau', true, true, 0, true, 'Caractéristiques non confirmées : à renseigner depuis l''administration.'),
    ('iPhone 18 Pro', 'iphone-18-pro', 'Description de démonstration, à personnaliser.', 'Nouveau', true, true, 1, true, 'Caractéristiques non confirmées : à renseigner depuis l''administration.'),
    ('iPhone 17',     'iphone-17',     'Description de démonstration, à personnaliser.', null,       true, true, 2, true, null),
    ('iPhone 17 Pro', 'iphone-17-pro', 'Description de démonstration, à personnaliser.', null,       true, true, 3, true, null)
  on conflict (slug) do nothing
  returning id
), c as (
  insert into public.product_colors (product_id, name, hex_code, display_order, is_default)
  select np.id, v.name, v.hex, v.ord, v.def
  from np cross join (values ('Noir','#1c1c1e',0,true), ('Blanc','#f2f2f7',1,false), ('Argent','#c7c7cc',2,false)) as v(name, hex, ord, def)
  returning id
)
insert into public.product_storage (product_id, label, capacity_value, price_in_cents, display_order, is_default)
select np.id, v.label, v.cap, v.price, v.ord, v.def
from np cross join (values ('128 Go',128,89900,0,true), ('256 Go',256,99900,1,false), ('512 Go',512,119900,2,false), ('1 To',1024,139900,3,false)) as v(label, cap, price, ord, def);
