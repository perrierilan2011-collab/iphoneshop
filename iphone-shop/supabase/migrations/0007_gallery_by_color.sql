-- Galerie par couleur : une photo peut être rattachée à une couleur (sinon elle vaut pour toutes).
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor, après 0006.
alter table public.product_images
  add column if not exists color_id uuid references public.product_colors(id) on delete cascade;
create index if not exists product_images_color_idx on public.product_images (color_id);
