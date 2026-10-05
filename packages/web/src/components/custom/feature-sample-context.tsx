import { createContext, ReactNode, useContext } from 'react';

export function InsideFeatureSampleProvider({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <InsideFeatureSampleContext.Provider value={true}>
      {children}
    </InsideFeatureSampleContext.Provider>
  );
}

export function useInsideFeatureSample(): boolean {
  return useContext(InsideFeatureSampleContext);
}

const InsideFeatureSampleContext = createContext(false);
