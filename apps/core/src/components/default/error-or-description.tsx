import type { ReactNode } from 'react';

export function ErrorOrDescription({ description, error }: { error?: string; description?: ReactNode }) {
  if (error) {
    return (
      <div className="rounded-md border border-error-600 bg-error-50 p-3 text-sm text-error-600">
        <p>{error}</p>
      </div>
    );
  }

  if (description) {
    return (
      <div className="rounded-md border border-foreground bg-background p-2 text-sm text-foreground">
        <p>{description}</p>
      </div>
    );
  }

  return null;
}
