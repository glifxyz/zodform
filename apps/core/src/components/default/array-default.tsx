import type { ReactNode } from 'react';
import { type UiPropertiesCompound } from '../../core/form';

export interface IArrayDefaultProps extends UiPropertiesCompound<any> {
  children: ReactNode[];
  onAdd: (newValue?: any) => void;
  onRemove: (index: number) => void;
}

export function ArrayDefault({ children, onAdd, onRemove, title, description }: IArrayDefaultProps) {
  return (
    <>
      <p>{title}</p>

      {children.map((child, index) => (
        <div key={index}>
          {child}
          <button type="button" onClick={() => onRemove(index)}>
            -
          </button>
        </div>
      ))}

      <button type="button" onClick={onAdd}>
        +
      </button>

      {description}
    </>
  );
}
