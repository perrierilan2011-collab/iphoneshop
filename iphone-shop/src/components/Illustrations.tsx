import type { Illustration, IllustrationPosition } from '@/lib/types';

/** Affiche les illustrations choisies dans l'admin pour une zone de la page (haut, milieu ou bas). */
export default function Illustrations({ items, position, priority }: { items: Illustration[]; position: IllustrationPosition; priority?: boolean }) {
  const list = items.filter((i) => i.position === position);
  if (list.length === 0) return null;
  return (
    <section className="section illus-zone" aria-label="Illustrations">
      {list.map((i, n) => (
        <figure key={i.id} className={`illus illus-${i.size}`}>
          <div className="showcase">
            <img src={i.image_url} alt={i.alt ?? ''} decoding="async"
              {...(priority && n === 0 ? { fetchPriority: 'high' as const } : { loading: 'lazy' as const })} />
          </div>
          {i.caption && <figcaption className="illus-cap muted">{i.caption}</figcaption>}
        </figure>
      ))}
    </section>
  );
}
