'use client';
import { useMemo, useState, useTransition } from 'react';
import { setWhitelist } from '@/app/admin/actions';

export type AccountRow = {
  id: string; email: string; whitelisted: boolean; isOwner: boolean; createdAt: string; lastLoginAt: string | null;
};

const fmt = (d: string | null) => (d ? new Date(d).toLocaleString('fr-FR', { dateStyle: 'short', timeStyle: 'short' }) : 'jamais');

export default function AccountList({ rows: initial, canManage }: { rows: AccountRow[]; canManage: boolean }) {
  const [rows, setRows] = useState(initial);
  const [q, setQ] = useState('');
  const [busy, setBusy] = useState<string | null>(null);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);
  const [, start] = useTransition();

  const shown = useMemo(() => {
    const n = q.trim().toLowerCase();
    return n ? rows.filter((r) => r.email.toLowerCase().includes(n)) : rows;
  }, [rows, q]);
  const whitelistedCount = rows.filter((r) => r.whitelisted || r.isOwner).length;

  function toggle(r: AccountRow) {
    const next = !r.whitelisted;
    setBusy(r.id); setMsg(null);
    start(async () => {
      try {
        const res = await setWhitelist(r.id, next);
        // Le changement n'est affiché que si le serveur l'a confirmé.
        if (res.ok) setRows((all) => all.map((x) => (x.id === r.id ? { ...x, whitelisted: next } : x)));
        setMsg({ ok: Boolean(res.ok), text: res.message });
      } catch {
        setMsg({ ok: false, text: 'La modification a échoué. Aucun changement confirmé.' });
      } finally {
        setBusy(null);
      }
    });
  }

  return (
    <>
      <div className="acc-bar">
        <input
          type="search" className="acc-search" value={q} onChange={(e) => setQ(e.target.value)}
          placeholder="Rechercher une adresse e-mail…" aria-label="Rechercher une adresse e-mail" autoComplete="off"
        />
        <span className="muted small">{shown.length} sur {rows.length} compte{rows.length > 1 ? 's' : ''} · {whitelistedCount} avec accès admin</span>
      </div>
      {!canManage && <p className="warn">Seul un propriétaire du site peut whitelister ou retirer un compte.</p>}
      {msg && <p role="status" className={msg.ok ? 'msg ok' : 'msg err'} style={{ margin: '10px 0' }}>{msg.text}</p>}

      <div className="acc-table" role="table" aria-label="Comptes">
        <div className="acc-row acc-head" role="row">
          <span role="columnheader">Adresse e-mail</span>
          <span role="columnheader">Inscrit le</span>
          <span role="columnheader">Dernière connexion</span>
          <span role="columnheader">Whitelist</span>
        </div>
        {shown.length === 0 && <p className="muted" style={{ padding: 20 }}>{rows.length === 0 ? 'Aucun compte pour le moment.' : 'Aucune adresse ne correspond à cette recherche.'}</p>}
        {shown.map((r) => (
          <div className="acc-row" role="row" key={r.id}>
            <span className="acc-mail" role="cell">{r.email}{r.isOwner && <em className="status live" style={{ marginLeft: 8, fontStyle: 'normal' }}>Propriétaire</em>}</span>
            <span className="muted small" role="cell">{fmt(r.createdAt)}</span>
            <span className="muted small" role="cell">{fmt(r.lastLoginAt)}</span>
            <span role="cell">
              {r.isOwner ? (
                <span className="muted small">Accès permanent</span>
              ) : (
                <button
                  type="button" className={r.whitelisted ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'}
                  disabled={!canManage || busy === r.id} onClick={() => toggle(r)}
                >
                  {busy === r.id ? 'En cours…' : r.whitelisted ? 'Retirer' : 'Whitelister'}
                </button>
              )}
            </span>
          </div>
        ))}
      </div>
    </>
  );
}
