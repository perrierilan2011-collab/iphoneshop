import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="wrap" style={{ padding: '120px 24px' }}>
      <h1 className="h1">Page introuvable</h1>
      <p className="muted">Ce produit n'existe pas ou n'est plus disponible.</p>
      <p><Link className="btn" href="/">Retour à l'accueil</Link></p>
    </div>
  );
}
