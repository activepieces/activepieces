import { useRef } from 'react';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/hooks/builder-hooks';

type BearProviderProps = React.PropsWithChildren<BuilderInitialState>;

export function BuilderStateProvider({
  children,
  ...props
}: BearProviderProps) {
  const storeRef = useRef<BuilderStore>();
  if (!storeRef.current) {
    storeRef.current = createBuilderStore({
      ...props,
      flowVersion: props.flowVersion,
    });
  }
  return (
    <BuilderStateContext.Provider value={storeRef.current}>
      {children}
    </BuilderStateContext.Provider>
  );
}
