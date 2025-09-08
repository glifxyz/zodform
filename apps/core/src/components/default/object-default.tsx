import type { ReactNode } from 'react';
import { type UiPropertiesCompound } from '../../core/form';

export interface IObjectDefaultProps extends UiPropertiesCompound<object> {
  children: ReactNode[] | ReactNode;
}

export function ObjectDefault({ children, title, description }: IObjectDefaultProps) {
  return (
    <div>
      {title && <h2>{title}</h2>}
      {description && <p>{description}</p>}
      {children}
    </div>
  );
}
