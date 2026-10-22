import type { Metadata } from 'next';
import { Inter } from 'next/font/google';
import type { CSSProperties, ReactNode } from 'react';
import { getSettings } from '@/lib/data';
import Nav from '@/components/Nav';
import Footer from '@/components/Footer';
import AutoRefresh from '@/components/AutoRefresh';
import './globals.css';

// Sur Mac et iPhone, la police système (San Francisco) est utilisée en priorité ; Inter prend le relais ailleurs.
const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-inter' });
const stack = `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', var(--font-inter), 'Helvetica Neue', Arial, sans-serif`;
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
      <body className={inter.variable} style={{ ...vars, fontFamily: stack }}>
        <Nav name={s.site_name} logoUrl={s.logo_url} links={s.nav_links.filter((l) => l.enabled)} />
        <main>{children}</main>
        <Footer text={s.footer_text} email={s.contact_email} name={s.site_name} />
        <AutoRefresh />
      </body>
    </html>
  );
}
