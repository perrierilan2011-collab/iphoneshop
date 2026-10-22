// Test d'intégration : nécessite un vrai projet Supabase (migration appliquée). Ignoré sinon.
import { describe, expect, it } from 'vitest';
import { createClient } from '@supabase/supabase-js';

const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
const anon = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

describe.skipIf(!url || !anon)('RLS : un visiteur anonyme', () => {
  const sb = () => createClient(url!, anon!, { auth: { persistSession: false } });

  it('ne peut pas modifier un produit', async () => {
    const { data } = await sb().from('products').update({ name: 'piraté' }).neq('slug', '').select();
    expect(data ?? []).toHaveLength(0);
  });
  it('ne peut pas modifier les paramètres du site', async () => {
    const { data } = await sb().from('site_settings').update({ site_name: 'piraté' }).eq('id', 1).select();
    expect(data ?? []).toHaveLength(0);
  });
  it('ne peut pas modifier un prix', async () => {
    const { data } = await sb().from('product_storage').update({ price_in_cents: 1 }).neq('label', '').select();
    expect(data ?? []).toHaveLength(0);
  });
  it('ne lit aucun stockage ni couleur désactivés, ni produit masqué', async () => {
    const c = await sb().from('product_colors').select('is_enabled');
    const s = await sb().from('product_storage').select('is_enabled');
    const p = await sb().from('products').select('is_published');
    expect((c.data ?? []).every((r) => r.is_enabled)).toBe(true);
    expect((s.data ?? []).every((r) => r.is_enabled)).toBe(true);
    expect((p.data ?? []).every((r) => r.is_published)).toBe(true);
  });
  it('ne lit pas la table admin_users', async () => {
    const { data } = await sb().from('admin_users').select('*');
    expect(data ?? []).toHaveLength(0);
  });
});
