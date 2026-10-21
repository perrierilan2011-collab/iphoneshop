import type { ReactNode } from 'react';

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return <label className="field"><span>{label}</span>{children}{hint && <span className="hint">{hint}</span>}</label>;
}

export function Check({ name, label, checked }: { name: string; label: string; checked: boolean }) {
  return <label className="field check"><input type="checkbox" name={name} defaultChecked={checked} /><span>{label}</span></label>;
}
