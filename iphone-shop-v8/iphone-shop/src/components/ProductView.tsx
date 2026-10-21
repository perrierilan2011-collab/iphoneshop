import { getSettings } from '@/lib/data';
import type { Product } from '@/lib/types';
import Configurator from './Configurator';

export default async function ProductView({ product }: { product: Product }) {
  const s = await getSettings();
  return (
    <div className="wrap">
      <Configurator product={product} buyLabel={s.buy_label} />
    </div>
  );
}
