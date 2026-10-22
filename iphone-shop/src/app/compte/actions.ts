'use server';
import { redirect } from 'next/navigation';
import { z } from 'zod';
import { recordLogin } from '@/lib/accounts';
import { supabaseServer } from '@/lib/supabase/server';
import type { State } from '@/lib/types';

const email = z.string().trim().toLowerCase().email('Adresse e-mail invalide.').max(254, 'Adresse e-mail trop longue.');
const password = z.string().min(8, 'Le mot de passe doit contenir au moins 8 caractères.').max(72, 'Le mot de passe est trop long (72 caractères maximum).');
const str = (fd: FormData, k: string) => String(fd.get(k) ?? '');

export async function signUp(_: State, fd: FormData): Promise<State> {
  const parsed = z.object({ email, password }).safeParse({ email: str(fd, 'email'), password: str(fd, 'password') });
  if (!parsed.success) return { ok: false, message: parsed.error.issues[0]?.message ?? 'Données invalides.' };
  if (str(fd, 'password') !== str(fd, 'confirm')) return { ok: false, message: 'Les deux mots de passe ne correspondent pas.' };

  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signUp({ email: parsed.data.email, password: parsed.data.password });
  if (error) {
    console.error('[signup]', error.message);
    if (/already|registered/i.test(error.message)) return { ok: false, message: 'Un compte existe déjà avec cette adresse. Connectez-vous.' };
    if (/password/i.test(error.message)) return { ok: false, message: 'Mot de passe refusé : choisissez-en un plus long ou plus complexe.' };
    return { ok: false, message: "Création du compte impossible pour le moment. Réessayez dans un instant." };
  }
  // Si la confirmation par e-mail est activée dans Supabase, il n'y a pas encore de session.
  if (data.session && data.user) {
    await recordLogin(data.user.id, data.user.email);
    redirect('/compte');
  }
  return { ok: true, message: 'Compte créé. Ouvrez l\'e-mail de confirmation que nous venons de vous envoyer, puis connectez-vous.' };
}

export async function signIn(_: State, fd: FormData): Promise<State> {
  const fail: State = { ok: false, message: 'E-mail ou mot de passe incorrect.' };
  const parsed = z.object({ email, password: z.string().min(1).max(72) }).safeParse({ email: str(fd, 'email'), password: str(fd, 'password') });
  if (!parsed.success) return fail;
  const sb = await supabaseServer();
  const { data, error } = await sb.auth.signInWithPassword(parsed.data);
  if (error || !data.user) {
    if (error && /confirm/i.test(error.message)) return { ok: false, message: "Votre adresse e-mail n'est pas encore confirmée. Ouvrez le message de confirmation reçu par e-mail." };
    return fail;
  }
  await recordLogin(data.user.id, data.user.email);
  redirect('/compte');
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect('/');
}
