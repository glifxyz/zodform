import { isNil } from 'lodash-es';
import { useState } from 'react';

export function useUncontrolledToControlledWarning(value: unknown) {
  const [firstValue] = useState(value);

  if (isNil(firstValue) && value !== undefined) {
    console.warn('Component changed from controlled to uncontrolled');
  }
}
