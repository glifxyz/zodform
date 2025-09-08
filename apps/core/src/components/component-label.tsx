import type { ReactNode } from 'react';

export function ComponentLabel({ label, children }: { label: ReactNode; children: ReactNode }) {
  return (
    <label
      style={{
        display: 'flex',
        flexDirection: 'column',
        gap: 4
      }}
    >
      {label}

      {children}
    </label>
  );
}
