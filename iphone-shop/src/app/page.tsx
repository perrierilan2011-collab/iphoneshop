import { getHomeProducts, getSettings } from '@/lib/data';
import ProductCard from '@/components/ProductCard';

export const revalidate = 3600;

export default async function Home() {
  const s = await getSettings();
  const products = await getHomeProducts(s.home_max_products);
  return (
    <>
      <section className="wrap hero">
        {s.slogan && <p className="muted">{s.slogan}</p>}
        <h1 className="h1">{s.homepage_title ?? s.site_name}</h1>
        {s.homepage_subtitle && <p className="lead">{s.homepage_subtitle}</p>}
        {s.home_show_intro && s.homepage_description && <p className="muted intro">{s.homepage_description}</p>}
      </section>
      <section id="iphone" className="wrap section">
        {s.products_heading && <h2 className="h2">{s.products_heading}</h2>}
        {products.length === 0
          ? <p className="muted">Aucun produit n'est publié pour le moment.</p>
          : <div className="grid-products">{products.map((p) => <ProductCard key={p.id} p={p} discoverLabel={s.discover_label} />)}</div>}
      </section>
    </>
  );
}
