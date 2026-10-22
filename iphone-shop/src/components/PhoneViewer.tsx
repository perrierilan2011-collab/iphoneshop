'use client';
import { useEffect, useRef, useState } from 'react';
import ZoomImage from './ZoomImage';

type Props = { modelUrl: string | null; imageUrl: string | null; alt: string; autoRotate: boolean; speed: number; zoom: boolean; scale: number; interactive?: boolean; card?: boolean; rotation?: [number, number, number]; reverse?: boolean; imageZoom?: number | null };
type Status = 'idle' | 'loading' | 'ready' | 'error' | 'nowebgl';

/** interactive=false : le modèle tourne seul, le visiteur ne peut pas le manipuler (cartes de la page d'accueil). */
export default function PhoneViewer({ modelUrl, imageUrl, alt, autoRotate, speed, zoom, scale, interactive = true, card = false, rotation = [0, 0, 0], reverse = false, imageZoom = null }: Props) {
  const host = useRef<HTMLDivElement>(null);
  const reset = useRef<() => void>(() => {});
  const [status, setStatus] = useState<Status>(modelUrl ? 'loading' : 'idle');

  useEffect(() => {
    if (!modelUrl || !host.current) return;
    const el = host.current;
    let disposed = false;
    let cleanup = () => {};

    const probe = document.createElement('canvas');
    if (!(probe.getContext('webgl2') || probe.getContext('webgl'))) { setStatus('nowebgl'); return; }

    (async () => {
      try {
        const THREE = await import('three');
        const { GLTFLoader } = await import('three/examples/jsm/loaders/GLTFLoader.js');
        const { OrbitControls } = await import('three/examples/jsm/controls/OrbitControls.js');
        const { RoomEnvironment } = await import('three/examples/jsm/environments/RoomEnvironment.js');
        if (disposed) return;

        const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
        renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
        renderer.toneMapping = THREE.ACESFilmicToneMapping;
        el.appendChild(renderer.domElement);
        if (!interactive) renderer.domElement.style.pointerEvents = 'none'; // les clics et le défilement passent à la carte
        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 0.2, 6);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.enabled = interactive;
        controls.enableZoom = zoom && interactive;
        controls.minDistance = 3.5;
        controls.maxDistance = 9;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.autoRotate = autoRotate && !reduceMotion;
        controls.autoRotateSpeed = speed * 2 * (reverse ? -1 : 1);
        let model: import('three').Object3D | null = null;
        const resize = () => {
          const w = el.clientWidth, h = el.clientHeight;
          if (!w || !h) return;
          renderer.setSize(w, h);
          camera.aspect = w / h;
          camera.updateProjectionMatrix();
        };
        const ro = new ResizeObserver(resize);
        ro.observe(el);
        resize();
        // Cartes : on ne dessine que lorsqu'elles sont visibles à l'écran (économie de batterie).
        let visible = true;
        const io = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; });
        if (card) io.observe(el);
        cleanup = () => {
          ro.disconnect();
          io.disconnect();
          renderer.setAnimationLoop(null);
          controls.dispose();
          model?.traverse((o) => {
            const m = o as import('three').Mesh;
            m.geometry?.dispose();
            const mat = m.material;
            (Array.isArray(mat) ? mat : mat ? [mat] : []).forEach((x) => x.dispose());
          });
          pmrem.dispose();
          renderer.dispose();
          renderer.domElement.remove();
        };

        const gltf = await new GLTFLoader().loadAsync(modelUrl);
        if (disposed) return;
        model = gltf.scene;
        const deg = Math.PI / 180;
        model.rotation.set(rotation[0] * deg, rotation[1] * deg, rotation[2] * deg); // orientation choisie dans l'administration
        model.updateMatrixWorld(true);
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const k = (3 / Math.max(size.x, size.y, size.z)) * scale;
        model.scale.setScalar(k);
        model.position.sub(center.multiplyScalar(k));
        scene.add(model);
        controls.saveState();
        reset.current = () => controls.reset();
        renderer.setAnimationLoop(() => {
          if (card && !visible) return;
          controls.update();
          renderer.render(scene, camera);
        });
        setStatus('ready');
      } catch {
        if (!disposed) setStatus('error');
      }
    })();

    return () => { disposed = true; cleanup(); };
  }, [modelUrl, autoRotate, speed, zoom, scale, interactive, card, rotation[0], rotation[1], rotation[2], reverse]);

  const showImage = status !== 'ready';
  return (
    <div className={card ? 'viewer viewer-card' : 'viewer'}>
      {modelUrl && status !== 'error' && status !== 'nowebgl' && (
        <div ref={host} className="viewer-canvas" role="img" aria-label={interactive ? `${alt} — modèle 3D interactif` : `${alt} — modèle 3D`} />
      )}
      {showImage && (imageUrl
        ? (imageZoom && !card
            ? <ZoomImage src={imageUrl} alt={alt} level={imageZoom} />
            : <img className="viewer-img" src={imageUrl} alt={alt} decoding="async" />)
        : <p className="muted small viewer-empty">Aucun visuel configuré</p>)}
      {!card && status === 'loading' && <p className="viewer-msg" role="status">Chargement du modèle 3D…</p>}
      {!card && status === 'error' && <p className="viewer-msg" role="status">Le modèle 3D n'a pas pu être chargé.</p>}
      {interactive && status === 'ready' && (
        <div className="viewer-bar">
          <span className="muted small">Faites glisser pour faire pivoter</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => reset.current()}>Réinitialiser la vue</button>
        </div>
      )}
    </div>
  );
}
