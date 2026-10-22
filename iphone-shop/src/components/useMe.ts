'use client';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';

export type Me = { email: string | null; canAdmin: boolean };

/** Lit l'état du visiteur (non mis en cache). Rechargé à chaque changement de page et au retour sur l'onglet. */
export function useMe(): Me | null {
  const path = usePathname();
  const [me, setMe] = useState<Me | null>(null);
  useEffect(() => {
    let alive = true;
    const load = () => {
      fetch('/api/me', { cache: 'no-store', credentials: 'same-origin' })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => { if (alive && d) setMe(d as Me); })
        .catch(() => {});
    };
    load();
    const onVisible = () => { if (document.visibilityState === 'visible') load(); };
    document.addEventListener('visibilitychange', onVisible);
    return () => { alive = false; document.removeEventListener('visibilitychange', onVisible); };
  }, [path]);
  return me;
}
