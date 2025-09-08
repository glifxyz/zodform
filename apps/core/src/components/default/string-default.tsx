import { ComponentLabel } from '../component-label';
import { type IComponentProps } from '../types';
import { ErrorOrDescription } from './error-or-description';

export type IStringDefaultProps = IComponentProps<string | undefined> & {
  placeholder?: string;
};

export function StringDefault({
  name,
  value,
  onChange,
  label,
  placeholder,
  description,
  errorMessage
}: IStringDefaultProps) {
  return (
    <ComponentLabel label={label}>
      <input
        type="text"
        name={name}
        value={value ?? ''}
        onChange={(event) => onChange(event.target.value)}
        placeholder={placeholder}
      />

      <ErrorOrDescription error={errorMessage} description={description} />
    </ComponentLabel>
  );
}
