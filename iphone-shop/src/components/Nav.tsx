'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import type { NavLink } from '@/lib/types';

function Item({ l }: { l: NavLink }) {
  return l.href.startsWith('/') ? <Link href={l.href}>{l.label}</Link> : <a href={l.href} rel="noopener noreferrer">{l.label}</a>;
}

export default function Nav({ name, logoUrl, links }: { name: string; logoUrl: string | null; links: NavLink[] }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  useEffect(() => setOpen(false), [path]);
  return (
    <header className="nav">
      <div className="wrap nav-in">
        <Link href="/" className="brand" aria-label={`${name} — accueil`}>
          {logoUrl ? <img src={logoUrl} alt={name} height={26} /> : name}
        </Link>
        <button className="burger" aria-expanded={open} aria-controls="menu" onClick={() => setOpen((o) => !o)}>
          {open ? 'Fermer' : 'Menu'}
        </button>
        <nav id="menu" className={open ? 'menu open' : 'menu'} aria-label="Navigation principale">
          {links.map((l, i) => <Item key={i} l={l} />)}
        </nav>
      </div>
    </header>
  );
}
