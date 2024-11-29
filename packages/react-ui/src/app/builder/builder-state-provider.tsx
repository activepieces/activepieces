import { useRef } from 'react';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { Permission } from '@activepieces/shared';

type BuilderStateProviderProps = React.PropsWithChildren<BuilderInitialState>;

export function BuilderStateProvider({
  children,
  sampleData,
  ...props
}: BuilderStateProviderProps) {
  const storeRef = useRef<BuilderStore>();
  const { checkAccess } = useAuthorization();
  const readonly = !checkAccess(Permission.WRITE_FLOW) || props.readonly;

  if (!storeRef.current) {
    storeRef.current = createBuilderStore({
      ...props,
      readonly,
      sampleData,
    });
  }
  return (
    <BuilderStateContext.Provider value={storeRef.current}>
      {children}
    </BuilderStateContext.Provider>
  );
}
