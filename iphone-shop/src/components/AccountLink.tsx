'use client';
import Link from 'next/link';
import { useMe } from './useMe';

/** Lien du menu : « Connexion » ou « Mon compte » selon l'état du visiteur. */
export default function AccountLink() {
  const me = useMe();
  if (!me) return null;
  return me.email ? <Link href="/compte">Mon compte</Link> : <Link href="/connexion">Connexion</Link>;
}
