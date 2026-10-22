'use client';
import { useActionState } from 'react';
import type { ReactNode } from 'react';
import type { State } from '@/lib/types';

type Props = {
  action: (prev: State, fd: FormData) => Promise<State>;
  submit: string; confirm?: string; danger?: boolean; className?: string; children?: ReactNode;
};

/** Le message de succès n'apparaît que si le serveur a réellement confirmé l'enregistrement. */
export default function ActionForm({ action, submit, confirm, danger, className, children }: Props) {
  const [state, formAction, pending] = useActionState(action, { ok: null, message: '' } as State);
  return (
    <form action={formAction} onSubmit={(e) => { if (confirm && !window.confirm(confirm)) e.preventDefault(); }}>
      <div className={className ?? 'grid'}>{children}</div>
      <div className="form-foot">
        <button type="submit" className={danger ? 'btn btn-danger btn-sm' : 'btn btn-primary btn-sm'} disabled={pending}>
          {pending ? 'En cours…' : submit}
        </button>
        {state.ok !== null && <p role="status" className={state.ok ? 'msg ok' : 'msg err'}>{state.message}</p>}
      </div>
    </form>
  );
}
