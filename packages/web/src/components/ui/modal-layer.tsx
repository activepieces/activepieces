import { createContext, ReactNode, useContext } from 'react';

export function ModalLayer({ children }: { children: ReactNode }) {
  return (
    <ModalLayerContext.Provider value={true}>
      {children}
    </ModalLayerContext.Provider>
  );
}

export function useInsideModalLayer(): boolean {
  return useContext(ModalLayerContext);
}

const ModalLayerContext = createContext(false);
