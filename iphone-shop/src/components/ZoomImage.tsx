'use client';
import { useRef, useState } from 'react';
import type { PointerEvent } from 'react';

/** Photo zoomable : un clic (ou Entrée) zoome, le pointeur déplace la zone vue, un second clic revient à la vue d'ensemble. */
export default function ZoomImage({ src, alt, level }: { src: string; alt: string; level: number }) {
  const box = useRef<HTMLButtonElement>(null);
  const [zoomed, setZoomed] = useState(false);
  const [origin, setOrigin] = useState('50% 50%');

  const follow = (e: PointerEvent) => {
    const r = box.current?.getBoundingClientRect();
    if (!r || r.width === 0) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setOrigin(`${x.toFixed(1)}% ${y.toFixed(1)}%`);
  };

  return (
    <button ref={box} type="button" className={zoomed ? 'zoomable is-zoomed' : 'zoomable'} aria-pressed={zoomed}
      aria-label={zoomed ? `Réduire la photo : ${alt}` : `Agrandir la photo : ${alt}`}
      onClick={(e) => { follow(e as unknown as PointerEvent); setZoomed((z) => !z); }}
      onPointerMove={(e) => { if (zoomed) follow(e); }}
      onBlur={() => setZoomed(false)}>
      <img src={src} alt={alt} decoding="async" draggable={false}
        style={{ transformOrigin: origin, transform: zoomed ? `scale(${level})` : 'scale(1)' }} />
      <span className="zoom-hint" aria-hidden="true">{zoomed ? '−' : '+'}</span>
    </button>
  );
}
