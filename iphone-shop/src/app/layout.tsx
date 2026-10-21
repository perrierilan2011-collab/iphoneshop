import type { Metadata } from 'next';
import { Hanken_Grotesk } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { getSettings } from '@/lib/data';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AutoRefresh from '@/components/AutoRefresh';
import './globals.css';

const font = Hanken_Grotesk({ subsets: ['latin'], display: 'swap' });
export const revalidate = 3600; // filet de sécurité ; les modifications admin invalident le cache immédiatement

export async function generateMetadata(): Promise<Metadata> {
  const s = await getSettings();
  return {
    title: { default: s.site_name, template: `%s — ${s.site_name}` },
    description: s.meta_description ?? s.slogan ?? undefined,
  };
}

export default async function RootLayout({ children }: { children: ReactNode }) {
  const s = await getSettings();
  const vars = {
    '--bg': s.background_color, '--card': s.card_color, '--text': s.text_color,
    '--accent': s.accent_color, '--radius': `${s.border_radius_px}px`,
  } as CSSProperties;
  return (
    <html lang="fr" data-anim={s.animations_enabled ? 'on' : 'off'}>
      <body className={font.className} style={vars}>
        <Nav name={s.site_name} logoUrl={s.logo_url} links={s.nav_links.filter((l) => l.enabled)} />
        <main>{children}</main>
        <Footer text={s.footer_text} email={s.contact_email} name={s.site_name} />
        <AutoRefresh />
      </body>
    </html>
  );
}
