-- Verrouillage de la rotation manuelle, couleur par couleur. À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.
alter table public.product_colors
  add column if not exists rotation_locked boolean not null default false;
