import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getIllustrations, getProductBySlug } from '@/lib/data';
import Illustrations from '@/components/Illustrations';
import ProductView from '@/components/ProductView';

export const revalidate = 3600;
type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await getProductBySlug((await params).slug);
  return p ? { title: p.name, description: p.description ?? undefined } : { title: 'Page introuvable' };
}

export default async function ProductPage({ params }: Props) {
  const p = await getProductBySlug((await params).slug);
  if (!p) notFound();
  const art = (await getIllustrations('product', p.id)) ?? [];
  return (
    <>
      <Illustrations items={art} position="top" priority />
      <ProductView product={p} />
      <Illustrations items={art} position="bottom" />
    </>
  );
}
