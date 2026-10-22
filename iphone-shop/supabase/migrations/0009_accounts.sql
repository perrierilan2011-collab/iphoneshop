-- Comptes visiteurs (e-mail + mot de passe) et whitelist.
-- À exécuter UNE SEULE FOIS dans Supabase > SQL Editor.
-- Les comptes eux-mêmes vivent dans auth.users (géré par Supabase, mot de passe haché). Cette table
-- ne garde qu'une copie de l'e-mail, la date de dernière connexion et le drapeau « whitelisted ».

create table if not exists public.profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  email text not null default '',
  whitelisted boolean not null default false,
  created_at timestamptz not null default now(),
  last_login_at timestamptz
);
create index if not exists profiles_email_idx on public.profiles (lower(email));

alter table public.profiles enable row level security;
-- Un visiteur ne peut lire que sa propre ligne et ne peut RIEN modifier (donc pas se whitelister lui-même).
-- Toutes les écritures passent par la clé service_role, côté serveur, après vérification du propriétaire.
drop policy if exists "profiles: lecture de sa propre ligne" on public.profiles;
create policy "profiles: lecture de sa propre ligne" on public.profiles for select using (user_id = auth.uid());
revoke all on public.profiles from anon, authenticated;
grant select on public.profiles to authenticated;

-- Crée automatiquement le profil à chaque nouvelle inscription.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (user_id, email) values (new.id, coalesce(new.email, ''))
  on conflict (user_id) do nothing;
  return new;
end;
$$;
drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created after insert on auth.users
  for each row execute function public.handle_new_user();

-- Reprise des comptes déjà existants (dont l'administrateur).
insert into public.profiles (user_id, email, created_at, last_login_at)
select id, coalesce(email, ''), created_at, last_sign_in_at from auth.users
on conflict (user_id) do nothing;

-- Un compte whitelisté a aussi accès aux données d'administration côté base.
create or replace function public.is_admin() returns boolean
language sql security definer set search_path = public stable as $$
  select exists (select 1 from public.admin_users where user_id = auth.uid())
      or exists (select 1 from public.profiles where user_id = auth.uid() and whitelisted);
$$;
