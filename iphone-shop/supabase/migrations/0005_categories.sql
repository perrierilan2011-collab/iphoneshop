-- Catégories du menu (façon Apple) + choix des articles de chaque catégorie depuis l'admin.
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.

create table if not exists public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null check (char_length(name) between 1 and 40),
  slug text not null unique check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$'),
  title text check (title is null or char_length(title) <= 80),
  description text check (description is null or char_length(description) <= 500),
  is_published boolean not null default false,
  display_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index if not exists categories_order_idx on public.categories (display_order);

create table if not exists public.category_products (
  category_id uuid not null references public.categories(id) on delete cascade,
  product_id uuid not null references public.products(id) on delete cascade,
  display_order int not null default 0,
  primary key (category_id, product_id)
);
create index if not exists category_products_product_idx on public.category_products (product_id);

drop trigger if exists touch_categories on public.categories;
create trigger touch_categories before update on public.categories
  for each row execute function public.touch_updated_at();

alter table public.categories enable row level security;
alter table public.category_products enable row level security;

drop policy if exists "categories: lecture publique des categories publiees" on public.categories;
create policy "categories: lecture publique des categories publiees" on public.categories for select using (is_published);
drop policy if exists "categories: admin" on public.categories;
create policy "categories: admin" on public.categories for all using (public.is_admin()) with check (public.is_admin());

drop policy if exists "category_products: lecture publique" on public.category_products;
create policy "category_products: lecture publique" on public.category_products for select using (
  exists (select 1 from public.categories c where c.id = category_id and c.is_published)
  and exists (select 1 from public.products p where p.id = product_id and p.is_published)
);
drop policy if exists "category_products: admin" on public.category_products;
create policy "category_products: admin" on public.category_products for all using (public.is_admin()) with check (public.is_admin());
