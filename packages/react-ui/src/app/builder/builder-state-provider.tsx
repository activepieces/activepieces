import { useRef } from 'react';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';

type BuilderStateProviderProps = React.PropsWithChildren<BuilderInitialState>;

export function BuilderStateProvider({
  children,
  ...props
}: BuilderStateProviderProps) {
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
