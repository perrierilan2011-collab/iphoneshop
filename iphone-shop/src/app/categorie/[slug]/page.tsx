import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getCategoryWithProducts, getSettings } from '@/lib/data';
import ProductCard from '@/components/ProductCard';

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const r = await getCategoryWithProducts((await params).slug);
  return r ? { title: r.category.title ?? r.category.name, description: r.category.description ?? undefined } : { title: 'Page introuvable' };
}

export default async function CategoryPage({ params }: Props) {
  const [r, s] = await Promise.all([getCategoryWithProducts((await params).slug), getSettings()]);
  if (!r) notFound();
  const { category, products } = r;
  return (
    <>
      <section className="wrap hero">
        <h1 className="h1">{category.title ?? category.name}</h1>
        {category.description && <p className="lead">{category.description}</p>}
      </section>
      <section className="section">
        {products.length === 0
          ? <p className="muted">Aucun article dans cette catégorie pour le moment.</p>
          : <div className="grid-products">{products.map((p) => <ProductCard key={p.id} p={p} discoverLabel={s.discover_label} />)}</div>}
      </section>
    </>
  );
}
