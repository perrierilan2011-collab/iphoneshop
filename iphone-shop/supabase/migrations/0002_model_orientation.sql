-- Orientation du modèle 3D et sens de rotation. À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.
alter table public.products
  add column if not exists model_rot_x numeric(6,1) not null default 0 check (model_rot_x between -360 and 360),
  add column if not exists model_rot_y numeric(6,1) not null default 0 check (model_rot_y between -360 and 360),
  add column if not exists model_rot_z numeric(6,1) not null default 0 check (model_rot_z between -360 and 360),
  add column if not exists rotate_reverse boolean not null default false;
