import { createContext as reactCreateContext, useContext } from 'react';

export function createContext<T>(initialValue?: T) {
  const context = reactCreateContext<T | undefined>(initialValue);

  const useContextConsumer = () => {
    const c = useContext(context);
    if (!c) {
      throw new Error('Component must be wrapped with <Container.Provider>');
    }
    return c;
  };

  return [useContextConsumer, context.Provider] as const;
}
