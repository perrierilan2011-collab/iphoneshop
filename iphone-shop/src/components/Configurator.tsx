'use client';
import { useState } from 'react';
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

  return (
    <div className="product">
      <div className="product-media">
        <PhoneViewer
          key={modelUrl ?? 'image'}
          modelUrl={modelUrl} imageUrl={imageUrl} alt={`${product.name}${color ? ` — ${color.name}` : ''}`}
          autoRotate={product.auto_rotate} speed={product.rotate_speed} zoom={product.zoom_enabled} scale={product.model_scale}
        />
      </div>
      <div className="product-info">
        {product.badge && <span className="badge badge-inline">{product.badge}</span>}
        <h1 className="h1">{product.name}</h1>
        {product.description && <p className="lead">{product.description}</p>}

        <p className="price" aria-live="polite">{storage ? formatPrice(storage.price_in_cents) : 'Prix bientôt disponible'}</p>

        <fieldset className="group">
          <legend>Couleur{color ? ` : ${color.name}` : ''}</legend>
          {product.colors.length === 0 ? <p className="muted small">Aucune couleur disponible.</p> : (
            <div role="radiogroup" aria-label="Couleur" className="swatches">
              {product.colors.map((c) => (
                <button key={c.id} type="button" role="radio" aria-checked={c.id === color?.id} aria-label={c.name} title={c.name}
                  className="swatch" style={{ background: c.hex_code }} onClick={() => setColorId(c.id)} />
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

        {buyHref
          ? <a className="btn btn-primary btn-lg" href={buyHref} target="_blank" rel="noopener noreferrer">{product.purchase_button_text || buyLabel}</a>
          : <><button className="btn btn-primary btn-lg" disabled>{product.purchase_button_text || buyLabel}</button>
              <p className="muted small">Achat indisponible pour cette configuration.</p></>}

        {product.extra_info && <p className="muted extra">{product.extra_info}</p>}
        {product.is_demo_data && <p className="muted small note">Données de démonstration : prix, couleurs et capacités sont des exemples modifiables dans l'administration.</p>}
      </div>
    </div>
  );
}
