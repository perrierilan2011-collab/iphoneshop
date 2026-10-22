import { notFound } from 'next/navigation';
import Configurator from '@/components/Configurator';
import { PRODUCT_SELECT, getSettings, shape } from '@/lib/data';
import { serviceClient } from '@/lib/supabase/service';

export default async function Preview({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { data } = await serviceClient().from('products').select(PRODUCT_SELECT).eq('id', id).maybeSingle();
  if (!data) notFound();
  const s = await getSettings();
  const p = shape(data, true);
  return (
    <>
      {!p.is_published && <p className="warn">Aperçu : ce produit est masqué, les visiteurs ne le voient pas.</p>}
      <Configurator product={p} buyLabel={s.buy_label} />
    </>
  );
}
