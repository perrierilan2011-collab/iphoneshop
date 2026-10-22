import { NextResponse } from 'next/server';
import { getAccess } from '@/lib/auth';

export const dynamic = 'force-dynamic';

/** État du visiteur courant, pour afficher « Connexion » / « Mon compte » et le bouton engrenage sans rendre les pages dynamiques. */
export async function GET() {
  const a = await getAccess();
  return NextResponse.json(
    { email: a.user?.email ?? null, canAdmin: a.canAdmin },
    { headers: { 'Cache-Control': 'no-store' } },
  );
}
