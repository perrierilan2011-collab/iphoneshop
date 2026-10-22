import { getHomeProducts, getIllustrations, getSettings } from '@/lib/data';
import type { Illustration } from '@/lib/types';
import Illustrations from '@/components/Illustrations';
import ProductCard from '@/components/ProductCard';

export const revalidate = 3600;

export default async function Home() {
  const s = await getSettings();
  const products = await getHomeProducts(s.home_max_products);
  // Si la migration 0008 n'est pas encore passée, on garde l'image historique en haut de l'accueil.
  const art: Illustration[] = (await getIllustrations('home')) ?? [{
    id: 'legacy', page: 'home', product_id: null, category_id: null, position: 'top', size: 'large',
    image_url: '/images/iphone-couleurs.jpg', alt: 'iPhone Pro vus de dos en noir, blanc, bleu et rouge bordeaux', caption: null,
    display_order: 0, is_published: true, created_at: '', updated_at: '',
  }];
  return (
    <>
      <section className="wrap hero">
        {s.slogan && <p className="eyebrow">{s.slogan}</p>}
        <h1 className="h1">{s.homepage_title ?? s.site_name}</h1>
        {s.homepage_subtitle && <p className="lead">{s.homepage_subtitle}</p>}
        {s.home_show_intro && s.homepage_description && <p className="muted intro">{s.homepage_description}</p>}
        {products.length > 0 && <div className="cta-row"><a className="btn btn-primary" href="#iphone">{s.discover_label}</a></div>}
      </section>
      <Illustrations items={art} position="top" priority />
      <section id="iphone" className="section">
        {s.products_heading && <h2 className="h2 section-head">{s.products_heading}</h2>}
        {products.length === 0
          ? <p className="muted">Aucun produit n'est publié pour le moment.</p>
          : <div className="grid-products">{products.map((p) => <ProductCard key={p.id} p={p} discoverLabel={s.discover_label} />)}</div>}
      </section>
      <Illustrations items={art} position="middle" />
      <section className="section" aria-labelledby="detail-title">
        <div className="feature">
          <div className="feature-text">
            <h2 id="detail-title" className="h2">Chaque détail compte.</h2>
            <p className="lead">Des finitions soignées, du module photo jusqu’au bord du cadre.</p>
            {products.length > 0 && <a className="link-arrow" href="#iphone">{s.discover_label}</a>}
          </div>
          <img src="/images/iphone-camera.jpg" width={748} height={494} alt="Détail du module photo d’un iPhone Pro, finition rouge bordeaux" loading="lazy" decoding="async" />
        </div>
      </section>
      <Illustrations items={art} position="bottom" />
    </>
  );
}
