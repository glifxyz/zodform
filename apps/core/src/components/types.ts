import type { ReactNode } from 'react';

export interface IComponentProps<Value> {
  value?: Value;
  defaultValue?: Value;
  onChange: (value: Value) => void;
  name: string;
  errorMessage?: string;
  isRequired?: boolean;
  label?: ReactNode;
  description?: ReactNode;
  autoFocus?: boolean;
}
