'use client';
import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/** Les pages déjà ouvertes récupèrent les changements de l'admin toutes les 60 s (onglet visible uniquement). */
export default function AutoRefresh() {
  const router = useRouter();
  useEffect(() => {
    const tick = () => { if (document.visibilityState === 'visible') router.refresh(); };
    const id = setInterval(tick, 60_000);
    document.addEventListener('visibilitychange', tick);
    return () => { clearInterval(id); document.removeEventListener('visibilitychange', tick); };
  }, [router]);
  return null;
}
