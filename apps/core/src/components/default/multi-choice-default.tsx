import type { ReactNode } from 'react';
import { type IComponentProps } from '../types';
import { ErrorOrDescription } from './error-or-description';

export type IMultiChoiceDefaultProps<Value extends string = string> = IComponentProps<Value[]> & {
  options: Value[];
  optionLabels?: Record<Value, ReactNode>;
};

export function MultiChoiceDefault({
  options,
  value = [],
  onChange,
  optionLabels,
  label,
  errorMessage,
  defaultValue,
  description
}: IMultiChoiceDefaultProps) {
  const resolvedValue = value ?? defaultValue ?? [];

  return (
    <div>
      {label}

      <div style={{ minHeight: 4 }} />

      {options.map((option) => {
        const label = optionLabels?.[option] ?? option;
        return (
          <label key={option} style={{ display: 'flex', flexDirection: 'row' }}>
            <input
              onChange={() => {
                if (resolvedValue.includes(option)) {
                  onChange(resolvedValue.filter((v) => v !== option));
                } else {
                  onChange([...resolvedValue, option]);
                }
              }}
              type="checkbox"
              checked={resolvedValue.includes(option)}
            />
            <span>{label}</span>
          </label>
        );
      })}

      <div style={{ minHeight: 4 }} />

      <ErrorOrDescription description={description} error={errorMessage} />
    </div>
  );
}
