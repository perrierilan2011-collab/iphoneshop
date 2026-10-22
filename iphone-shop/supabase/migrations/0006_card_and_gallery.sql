-- Image/affichage de la carte d'accueil + galerie de photos de la page produit.
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor, AVANT de déployer cette version.

alter table public.products
  add column if not exists card_display text not null default 'model' check (card_display in ('model', 'image')),
  add column if not exists card_image_url text;

create table if not exists public.product_images (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  url text not null,
  alt text check (alt is null or char_length(alt) <= 120),
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists product_images_product_idx on public.product_images (product_id);

drop trigger if exists touch_product_images on public.product_images;
create trigger touch_product_images before update on public.product_images
  for each row execute function public.touch_updated_at();

alter table public.product_images enable row level security;

drop policy if exists "images: lecture publique des produits publies" on public.product_images;
create policy "images: lecture publique des produits publies" on public.product_images for select
  using (exists (select 1 from public.products p where p.id = product_id and p.is_published));
drop policy if exists "images: admin" on public.product_images;
create policy "images: admin" on public.product_images for all using (public.is_admin()) with check (public.is_admin());
