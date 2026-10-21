// Usage : ADMIN_EMAIL=moi@exemple.fr ADMIN_PASSWORD='un-mot-de-passe-long' npm run create-admin
// Le mot de passe n'est jamais stocké dans le projet : il est lu depuis l'environnement du terminal.
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL;
const password = process.env.ADMIN_PASSWORD;

if (!url || !key || !email || !password) {
  console.error('Variables manquantes : NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD.');
  process.exit(1);
}
if (password.length < 12) {
  console.error('Le mot de passe doit contenir au moins 12 caractères.');
  process.exit(1);
}

const sb = createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } });

async function main() {
  let userId: string | undefined;
  const created = await sb.auth.admin.createUser({ email, password, email_confirm: true });
  if (created.data.user) {
    userId = created.data.user.id;
  } else {
    const list = await sb.auth.admin.listUsers({ page: 1, perPage: 1000 });
    userId = list.data.users.find((u) => u.email?.toLowerCase() === email!.toLowerCase())?.id;
    if (!userId) throw new Error(created.error?.message ?? 'Création impossible.');
    console.log('Utilisateur déjà existant : il est simplement promu administrateur.');
  }
  const { error } = await sb.from('admin_users').upsert({ user_id: userId });
  if (error) throw new Error(error.message);
  console.log(`Administrateur prêt : ${email}`);
}
main().catch((e) => { console.error(e.message); process.exit(1); });
