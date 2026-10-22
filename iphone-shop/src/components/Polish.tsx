'use client';
import { usePathname } from 'next/navigation';
import { useEffect } from 'react';

const REVEAL = '.card, .showcase, .feature, .section-head, .product-media, .product-info';

/**
 * Finitions d'interface : apparition douce au défilement, halo qui suit le curseur sur les cartes,
 * barre de navigation qui s'affirme au défilement. Tout est désactivé si l'animation est coupée
 * (réglage admin) ou si le visiteur préfère moins de mouvement.
 */
export default function Polish() {
  const path = usePathname();

  useEffect(() => {
    const root = document.documentElement;
    const calm = matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.anim === 'off';
    const onScroll = () => root.toggleAttribute('data-scrolled', window.scrollY > 8);
    onScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    let raf = 0;
    const onMove = (e: PointerEvent) => {
      if (calm || e.pointerType !== 'mouse') return;
      const el = (e.target as Element | null)?.closest<HTMLElement>('.card, .feature');
      if (!el) return;
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const r = el.getBoundingClientRect();
        el.style.setProperty('--mx', `${e.clientX - r.left}px`);
        el.style.setProperty('--my', `${e.clientY - r.top}px`);
      });
    };
    document.addEventListener('pointermove', onMove, { passive: true });

    return () => { window.removeEventListener('scroll', onScroll); document.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (matchMedia('(prefers-reduced-motion: reduce)').matches || root.dataset.anim === 'off' || !('IntersectionObserver' in window)) return;
    const io = new IntersectionObserver((entries) => {
      for (const en of entries) {
        if (!en.isIntersecting) continue;
        const el = en.target as HTMLElement;
        el.dataset.reveal = 'in'; io.unobserve(el);
        // Une fois apparu, l'élément retrouve ses transitions normales (survol, etc.).
        setTimeout(() => { delete el.dataset.reveal; el.style.removeProperty('--rv-delay'); }, 1300);
      }
    }, { rootMargin: '0px 0px -8% 0px', threshold: 0.08 });
    document.querySelectorAll<HTMLElement>(REVEAL).forEach((el, i) => {
      // Ce qui est déjà visible à l'arrivée reste en place : pas de clignotement.
      if (el.getBoundingClientRect().top < window.innerHeight * 0.92) return;
      el.dataset.reveal = 'out';
      el.style.setProperty('--rv-delay', `${(i % 3) * 70}ms`);
      io.observe(el);
    });
    return () => io.disconnect();
  }, [path]);

  return null;
}
