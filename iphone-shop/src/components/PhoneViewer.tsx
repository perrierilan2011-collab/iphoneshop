'use client';
import { useEffect, useRef, useState } from 'react';

type Props = { modelUrl: string | null; imageUrl: string | null; alt: string; autoRotate: boolean; speed: number; zoom: boolean; scale: number };
type Status = 'idle' | 'loading' | 'ready' | 'error' | 'nowebgl';

export default function PhoneViewer({ modelUrl, imageUrl, alt, autoRotate, speed, zoom, scale }: Props) {
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
        const scene = new THREE.Scene();
        const pmrem = new THREE.PMREMGenerator(renderer);
        scene.environment = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
        const camera = new THREE.PerspectiveCamera(35, 1, 0.1, 100);
        camera.position.set(0, 0.2, 6);
        const controls = new OrbitControls(camera, renderer.domElement);
        controls.enablePan = false;
        controls.enableDamping = true;
        controls.enableZoom = zoom;
        controls.minDistance = 3.5;
        controls.maxDistance = 9;
        const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
        controls.autoRotate = autoRotate && !reduceMotion;
        controls.autoRotateSpeed = speed * 2;
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
        cleanup = () => {
          ro.disconnect();
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
        const box = new THREE.Box3().setFromObject(model);
        const size = box.getSize(new THREE.Vector3());
        const center = box.getCenter(new THREE.Vector3());
        const k = (3 / Math.max(size.x, size.y, size.z)) * scale;
        model.scale.setScalar(k);
        model.position.sub(center.multiplyScalar(k));
        scene.add(model);
        controls.saveState();
        reset.current = () => controls.reset();
        renderer.setAnimationLoop(() => { controls.update(); renderer.render(scene, camera); });
        setStatus('ready');
      } catch {
        if (!disposed) setStatus('error');
      }
    })();

    return () => { disposed = true; cleanup(); };
  }, [modelUrl, autoRotate, speed, zoom, scale]);

  const showImage = status !== 'ready';
  return (
    <div className="viewer">
      {modelUrl && status !== 'error' && status !== 'nowebgl' && (
        <div ref={host} className="viewer-canvas" role="img" aria-label={`${alt} — modèle 3D interactif`} />
      )}
      {showImage && (imageUrl
        ? <img className="viewer-img" src={imageUrl} alt={alt} decoding="async" />
        : <p className="muted small viewer-empty">Aucun visuel configuré</p>)}
      {status === 'loading' && <p className="viewer-msg" role="status">Chargement du modèle 3D…</p>}
      {status === 'error' && <p className="viewer-msg" role="status">Le modèle 3D n'a pas pu être chargé.</p>}
      {status === 'ready' && (
        <div className="viewer-bar">
          <span className="muted small">Faites glisser pour faire pivoter</span>
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => reset.current()}>Réinitialiser la vue</button>
        </div>
      )}
    </div>
  );
}
