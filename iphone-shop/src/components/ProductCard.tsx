import Link from 'next/link';
import { formatPrice, startingPrice } from '@/lib/pricing';
import type { Product } from '@/lib/types';
import CardViewer from './CardViewer';

export default function ProductCard({ p, discoverLabel }: { p: Product; discoverLabel: string }) {
  const price = startingPrice(p);
  // Image de la carte : image principale, sinon image de la couleur par défaut, sinon de la première couleur qui en a une.
  const cardImage =
    p.main_image_url ||
    p.colors.find((c) => c.is_default && c.image_url)?.image_url ||
    p.colors.find((c) => c.image_url)?.image_url ||
    null;
  // Modèle 3D de la carte : celui du produit, sinon celui de la couleur par défaut, sinon de la première couleur qui en a un.
  const cardModel =
    p.model_3d_url ||
    p.colors.find((c) => c.is_default && c.model_3d_url)?.model_3d_url ||
    p.colors.find((c) => c.model_3d_url)?.model_3d_url ||
    null;
  return (
    <Link href={`/${p.slug}`} className="card" aria-label={`${p.name} — ${discoverLabel}`}>
      <div className="card-media">
        {p.badge && <span className="badge">{p.badge}</span>}
        {cardModel
          ? <CardViewer modelUrl={cardModel} imageUrl={cardImage} alt={p.name} autoRotate={p.auto_rotate} speed={p.rotate_speed} scale={p.model_scale}
              rotation={[p.model_rot_x, p.model_rot_y, p.model_rot_z]} reverse={p.rotate_reverse} />
          : cardImage
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
