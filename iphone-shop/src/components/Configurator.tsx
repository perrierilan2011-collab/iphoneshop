'use client';
import { useState } from 'react';
import ZoomImage from './ZoomImage';
import dynamic from 'next/dynamic';
import { formatPrice, pickDefaults, resolvePurchaseUrl } from '@/lib/pricing';
import type { Product } from '@/lib/types';

// Three.js n'est chargé que sur les pages produit, et seulement côté navigateur.
const PhoneViewer = dynamic(() => import('./PhoneViewer'), { ssr: false, loading: () => <div className="viewer" aria-busy="true" /> });

export default function Configurator({ product, buyLabel }: { product: Product; buyLabel: string }) {
  const defaults = pickDefaults(product);
  const [colorId, setColorId] = useState<string | null>(defaults.color?.id ?? null);
  const [storageId, setStorageId] = useState<string | null>(defaults.storage?.id ?? null);
  // Si la sélection n'existe plus (variante désactivée entre-temps), on retombe sur une valeur valide.
  const color = product.colors.find((c) => c.id === colorId) ?? defaults.color;
  const storage = product.storages.find((s) => s.id === storageId) ?? defaults.storage;
  const url = color && storage ? resolvePurchaseUrl(product, color, storage) : null;
  const buyHref = url && color && storage ? `/go/${product.slug}?color=${color.id}&storage=${storage.id}` : null;
  const modelUrl = color?.model_3d_url || product.model_3d_url;
  const imageUrl = color?.image_url || product.main_image_url;

  // Galerie de la couleur choisie : le modèle 3D (s'il existe) puis les photos de cette couleur (+ celles valables pour toutes).
  const photos = product.images.filter((i) => i.color_id === null || i.color_id === color?.id);
  type Slide = { kind: 'model' } | { kind: 'photo'; id: string; url: string; alt: string | null };
  const slides: Slide[] = [...(modelUrl ? [{ kind: 'model' } as Slide] : []), ...photos.map((i) => ({ kind: 'photo', id: i.id, url: i.url, alt: i.alt }) as Slide)];
  const [pos, setPos] = useState(0);
  const idx = slides.length > 0 ? Math.min(pos, slides.length - 1) : 0;
  const slide = slides[idx];
  const photo = slide?.kind === 'photo' ? slide : undefined;
  const go = (d: number) => setPos((idx + d + slides.length) % slides.length);
  const chooseColor = (id: string) => { setColorId(id); setPos(0); }; // on repart du modèle 3D à chaque changement de couleur
  const multi = slides.length > 1;

  return (
    <div className="product">
      <div className="product-media" onKeyDown={(e) => { if (!multi) return; if (e.key === 'ArrowLeft') go(-1); else if (e.key === 'ArrowRight') go(1); }}>
        <div className="stage">
          {photo ? (
            <div className="viewer">
              {product.image_zoom_enabled
                ? <ZoomImage key={photo.id} src={photo.url} alt={photo.alt || product.name} level={product.image_zoom_level} />
                : <img className="viewer-img" src={photo.url} alt={photo.alt || product.name} decoding="async" />}
            </div>
          ) : (
            <PhoneViewer
              key={modelUrl ?? 'image'}
              modelUrl={modelUrl} imageUrl={imageUrl} alt={`${product.name}${color ? ` — ${color.name}` : ''}`}
              autoRotate={product.auto_rotate} speed={product.rotate_speed} zoom={product.zoom_enabled} scale={product.model_scale}
              interactive={!color?.rotation_locked} imageZoom={product.image_zoom_enabled ? product.image_zoom_level : null}
              rotation={[product.model_rot_x, product.model_rot_y, product.model_rot_z]} reverse={product.rotate_reverse}
            />
          )}
          {multi && (
            <>
              <button type="button" className="arrow arrow-prev" onClick={() => go(-1)} aria-label="Vue précédente"><span aria-hidden="true">‹</span></button>
              <button type="button" className="arrow arrow-next" onClick={() => go(1)} aria-label="Vue suivante"><span aria-hidden="true">›</span></button>
            </>
          )}
        </div>
        {multi && (
          <div className="thumbs" role="tablist" aria-label="Vues du produit">
            {slides.map((sl, n) => (
              <button key={sl.kind === 'model' ? 'model' : sl.id} type="button" role="tab" aria-selected={n === idx}
                className={sl.kind === 'model' ? 'thumb thumb-3d' : 'thumb'} onClick={() => setPos(n)}
                aria-label={sl.kind === 'model' ? 'Vue 3D' : sl.alt || `Photo ${n}`}>
                {sl.kind === 'model' ? '3D' : <img src={sl.url} alt="" loading="lazy" decoding="async" />}
              </button>
            ))}
          </div>
        )}
      </div>
      <div className="product-info">
        {product.badge && <span className="badge badge-inline">{product.badge}</span>}
        <h1 className="h1">{product.name}</h1>
        {product.description && <p className="lead">{product.description}</p>}

        <p className="price" aria-live="polite">{storage ? formatPrice(storage.price_in_cents) : 'Prix bientôt disponible'}</p>

        <fieldset className="group">
          <legend>Couleur{color ? <> <span>{color.name}</span></> : ''}</legend>
          {product.colors.length === 0 ? <p className="muted small">Aucune couleur disponible.</p> : (
            <div role="radiogroup" aria-label="Couleur" className="swatches">
              {product.colors.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={c.id === color?.id} aria-label={c.name} title={c.name}
                  className="swatch" style={{ background: c.hex_code }} onClick={() => chooseColor(c.id)} />
              ))}
            </div>
          )}
        </fieldset>

        <fieldset className="group">
          <legend>Stockage</legend>
          {product.storages.length === 0 ? <p className="muted small">Aucun stockage disponible.</p> : (
            <div role="radiogroup" aria-label="Stockage" className="options">
              {product.storages.map((s) => (
                <button key={s.id} type="button" role="radio" aria-checked={s.id === storage?.id} className="opt" onClick={() => setStorageId(s.id)}>
                  <span>{s.label}</span><span className="muted small">{formatPrice(s.price_in_cents)}</span>
                </button>
              ))}
            </div>
          )}
        </fieldset>

        <div className="buy">
        {buyHref
          ? <a className="btn btn-primary btn-lg" href={buyHref} target="_blank" rel="noopener noreferrer">{product.purchase_button_text || buyLabel}</a>
          : <><button className="btn btn-primary btn-lg" disabled>{product.purchase_button_text || buyLabel}</button>
              <p className="muted small">Achat indisponible pour cette configuration.</p></>}
        </div>

        {product.extra_info && <p className="muted extra">{product.extra_info}</p>}
        {product.is_demo_data && <p className="muted small note">Données de démonstration : prix, couleurs et capacités sont des exemples modifiables dans l'administration.</p>}
      </div>
    </div>
  );
}
