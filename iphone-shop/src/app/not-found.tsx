import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty">
      <img className="empty-art" src="/images/iphone-violet.webp" width={1400} height={641} alt="" aria-hidden="true" decoding="async" />
      <h1 className="h1">Page introuvable</h1>
      <p className="lead">Ce produit n'existe pas ou n'est plus disponible.</p>
      <p><Link className="btn btn-primary" href="/">Retour à l'accueil</Link></p>
    </div>
  );
}
