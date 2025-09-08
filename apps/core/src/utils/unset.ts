import { isNil } from 'lodash-es';
import { type ComponentPath } from '../core/form';

interface IUnsetOptions {
  // What to do when the path points to an array element?
  arrayBehavior?: 'delete' | 'setToUndefined';
}

export function unset(
  obj: Record<string, unknown>,
  path: ComponentPath,
  options: IUnsetOptions = {
    arrayBehavior: 'delete'
  }
): void {
  let current = obj;
  for (const key of path.slice(0, -1)) {
    current = current[key] as Record<string, unknown>;
    if (isNil(current)) {
      return;
    }
  }

  const lastKey = path[path.length - 1];
  if (isNil(lastKey)) {
    return;
  }

  if (Array.isArray(current)) {
    if (typeof lastKey !== 'number') {
      return;
    }
    if (options.arrayBehavior === 'delete') {
      current.splice(lastKey, 1);
    } else {
      current[lastKey] = undefined;
    }
    return;
  }

  if (typeof current === 'object') {
    delete current[lastKey];
    return;
  }
}
