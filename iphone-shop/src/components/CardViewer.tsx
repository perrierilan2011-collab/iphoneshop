'use client';
import dynamic from 'next/dynamic';

// Three.js n'est chargé que si une carte a un modèle 3D, et seulement côté navigateur.
const PhoneViewer = dynamic(() => import('./PhoneViewer'), { ssr: false, loading: () => <div className="viewer viewer-card" aria-busy="true" /> });

type Props = { modelUrl: string; imageUrl: string | null; alt: string; autoRotate: boolean; speed: number; scale: number; rotation: [number, number, number]; reverse: boolean };

/** Modèle 3D de la page d'accueil : il tourne seul et n'est pas manipulable. */
export default function CardViewer({ modelUrl, imageUrl, alt, autoRotate, speed, scale, rotation, reverse }: Props) {
  return <PhoneViewer interactive={false} card modelUrl={modelUrl} imageUrl={imageUrl} alt={alt} autoRotate={autoRotate} speed={speed} zoom={false} scale={scale} rotation={rotation} reverse={reverse} />;
}
