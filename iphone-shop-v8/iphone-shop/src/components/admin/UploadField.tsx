'use client';
import { useEffect, useRef, useState } from 'react';
import { createClient } from '@supabase/supabase-js';
import { createUpload } from '@/app/admin/actions';

type Props = { name: string; label: string; kind: 'image' | 'model'; defaultValue: string | null; hint?: string };

/**
 * Envoi direct du fichier vers Supabase Storage (jeton à usage unique délivré par le serveur
 * uniquement à un administrateur connecté). Le champ caché `name` reçoit l'URL publique
 * et est enregistré avec le reste du formulaire.
 */
export default function UploadField({ name, label, kind, defaultValue, hint }: Props) {
  const [value, setValue] = useState(defaultValue ?? '');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Empêche d'enregistrer le formulaire pendant l'envoi.
  useEffect(() => { fileRef.current?.setCustomValidity(busy ? 'Envoi en cours, patientez avant d\'enregistrer.' : ''); }, [busy]);

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError(''); setBusy(true);
    try {
      const r = await createUpload(kind, file.name, file.size);
      if (!r.ok) throw new Error(r.message);
      const sb = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
        auth: { persistSession: false, autoRefreshToken: false },
      });
      const contentType = kind === 'model' ? 'model/gltf-binary' : file.type || 'application/octet-stream';
      const { error: upErr } = await sb.storage.from('media').uploadToSignedUrl(r.path, r.token, file, { contentType });
      if (upErr) throw new Error("L'envoi du fichier a échoué. Réessayez.");
      setValue(r.publicUrl);
    } catch (err) {
      setError(err instanceof Error ? err.message : "L'envoi a échoué.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = '';
    }
  }

  const accept = kind === 'image' ? 'image/png,image/jpeg,image/webp,image/gif,image/avif' : '.glb,.gltf';
  return (
    <div className="field upload">
      <span>{label}</span>
      <input type="hidden" name={name} value={value} readOnly />
      {value && kind === 'image' && <img src={value} alt="" style={{ maxHeight: 120, maxWidth: '100%', objectFit: 'contain', borderRadius: 10, alignSelf: 'flex-start' }} />}
      {value && kind === 'model' && <span className="hint">Modèle 3D enregistré : {decodeURIComponent(value.split('/').pop() ?? '')}</span>}
      {!value && !busy && <span className="hint">Aucun fichier.</span>}
      {busy && <span className="hint" role="status">Envoi en cours…</span>}
      <input ref={fileRef} type="file" accept={accept} onChange={onPick} disabled={busy} />
      {value && !busy && (
        <button type="button" className="btn btn-danger btn-sm" style={{ alignSelf: 'flex-start' }} onClick={() => setValue('')}>
          Retirer le fichier
        </button>
      )}
      {hint && <span className="hint">{hint}</span>}
      {error && <span className="msg err" role="alert">{error}</span>}
    </div>
  );
}
