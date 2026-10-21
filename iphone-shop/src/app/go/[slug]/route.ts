import { NextResponse } from 'next/server';
import { getProductBySlug } from '@/lib/data';
import { resolvePurchaseUrl } from '@/lib/pricing';

export const dynamic = 'force-dynamic';

/**
 * Redirection d'achat résolue CÔTÉ SERVEUR à partir des seules variantes actives.
 * Une couleur/un stockage désactivé, inconnu ou manipulé dans l'URL est refusé.
 */
export async function GET(req: Request, { params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params;
  const sp = new URL(req.url).searchParams;
  const headers = { 'Cache-Control': 'no-store' };
  const product = await getProductBySlug(slug);
  if (!product) return new NextResponse('Produit introuvable.', { status: 404, headers });
  const color = product.colors.find((c) => c.id === sp.get('color'));
  const storage = product.storages.find((s) => s.id === sp.get('storage'));
  if (!color || !storage) return new NextResponse('Configuration indisponible.', { status: 400, headers });
  const url = resolvePurchaseUrl(product, color, storage);
  if (!url) return new NextResponse("Aucun lien d'achat n'est configuré pour cette configuration.", { status: 404, headers });
  return NextResponse.redirect(url, { status: 302, headers });
}
