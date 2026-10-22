-- Zoom sur les photos, produit par produit. À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.
alter table public.products
  add column if not exists image_zoom_enabled boolean not null default true,
  add column if not exists image_zoom_level numeric not null default 2.5
    check (image_zoom_level between 1.5 and 5);
