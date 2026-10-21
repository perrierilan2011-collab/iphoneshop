import Link from 'next/link';
import { formatPrice, startingPrice } from '@/lib/pricing';
import type { Product } from '@/lib/types';

export default function ProductCard({ p, discoverLabel }: { p: Product; discoverLabel: string }) {
  const price = startingPrice(p);
  // Image de la carte : image principale, sinon image de la couleur par défaut, sinon de la première couleur qui en a une.
  const cardImage =
    p.main_image_url ||
    p.colors.find((c) => c.is_default && c.image_url)?.image_url ||
    p.colors.find((c) => c.image_url)?.image_url ||
    null;
  return (
    <Link href={`/${p.slug}`} className="card" aria-label={`${p.name} — ${discoverLabel}`}>
      <div className="card-media">
        {p.badge && <span className="badge">{p.badge}</span>}
        {cardImage
          ? <img src={cardImage} alt={p.name} loading="lazy" decoding="async" />
          : <span className="muted small">Aucun visuel configuré</span>}
      </div>
      <div className="card-body">
        <h3>{p.name}</h3>
        {p.description && <p className="muted">{p.description}</p>}
        <p className="price-sm">{price !== null ? `À partir de ${formatPrice(price)}` : 'Prix bientôt disponible'}</p>
        <span className="btn btn-ghost">{discoverLabel}</span>
      </div>
    </Link>
  );
}
