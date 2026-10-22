-- Illustrations placables depuis l'admin : une image, la page où elle apparaît, sa position, sa taille.
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor, après 0007.

create table if not exists public.illustrations (
  id uuid primary key default gen_random_uuid(),
  page text not null check (page in ('home', 'product', 'category')),
  product_id uuid references public.products(id) on delete cascade,
  category_id uuid references public.categories(id) on delete cascade,
  position text not null default 'top' check (position in ('top', 'middle', 'bottom')),
  size text not null default 'large' check (size in ('large', 'medium', 'small')),
  image_url text not null check (char_length(image_url) between 1 and 2000),
  alt text check (alt is null or char_length(alt) <= 120),
  caption text check (caption is null or char_length(caption) <= 200),
  display_order int not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  check (
    (page = 'home' and product_id is null and category_id is null) or
    (page = 'product' and product_id is not null and category_id is null) or
    (page = 'category' and category_id is not null and product_id is null)
  ),
  check (position <> 'middle' or page = 'home')
);
create index if not exists illustrations_page_idx on public.illustrations (page, display_order);
create index if not exists illustrations_product_idx on public.illustrations (product_id);
create index if not exists illustrations_category_idx on public.illustrations (category_id);

drop trigger if exists touch_illustrations on public.illustrations;
create trigger touch_illustrations before update on public.illustrations
  for each row execute function public.touch_updated_at();

alter table public.illustrations enable row level security;

drop policy if exists "illustrations: lecture publique des illustrations publiees" on public.illustrations;
create policy "illustrations: lecture publique des illustrations publiees" on public.illustrations for select using (is_published);
drop policy if exists "illustrations: admin" on public.illustrations;
create policy "illustrations: admin" on public.illustrations for all using (public.is_admin()) with check (public.is_admin());

-- L'image actuellement en haut de l'accueil devient une illustration modifiable ou supprimable depuis l'admin.
insert into public.illustrations (page, position, size, image_url, alt, display_order)
select 'home', 'top', 'large', '/images/iphone-couleurs.jpg',
       'iPhone Pro vus de dos en noir, blanc, bleu et rouge bordeaux', 0
where not exists (select 1 from public.illustrations);
