import { type IComponentProps } from '../types';
import { ErrorOrDescription } from './error-or-description';
import { ComponentLabel } from '../component-label';

function formatDateValue(date: Date) {
  return date.toISOString().split('T')[0];
}

export type IDateDefaultProps = IComponentProps<Date | undefined>;

export function DateDefault({
  value,
  onChange,
  label,
  description,
  errorMessage,
  name,
  autoFocus
}: IDateDefaultProps) {
  return (
    <ComponentLabel label={label}>
      <input
        type="date"
        name={name}
        value={value ? formatDateValue(value) : ''}
        onChange={(event) => {
          if (event.target.value === '') {
            onChange(undefined);
            return;
          }

          try {
            onChange(new Date(event.target.value));
          } catch {
            onChange(undefined);
          }
        }}
        autoFocus={autoFocus}
      />

      <ErrorOrDescription error={errorMessage} description={description} />
    </ComponentLabel>
  );
}
