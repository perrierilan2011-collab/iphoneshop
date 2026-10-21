import Link from 'next/link';
export default function NotFound() {
  return (
    <div className="empty">
      <h1 className="h1">Page introuvable</h1>
      <p className="lead">Ce produit n'existe pas ou n'est plus disponible.</p>
      <p><Link className="btn btn-primary" href="/">Retour à l'accueil</Link></p>
    </div>
  );
}
