import { Permission } from '@activepieces/shared';
import { useRef } from 'react';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useAuthorization } from '@/components/authorization';

type BuilderStateProviderProps = React.PropsWithChildren<BuilderInitialState>;

export function BuilderStateProvider({
  children,
  ...props
}: BuilderStateProviderProps) {
  const storeRef = useRef<BuilderStore>();
  const { checkAccess } = useAuthorization();
  if (!storeRef.current) {
    storeRef.current = createBuilderStore({
      ...props,
      readonly: !checkAccess(Permission.UPDATE_FLOW_STATUS) || props.readonly,
      
    });
  }
  return (
    <BuilderStateContext.Provider value={storeRef.current}>
      {children}
    </BuilderStateContext.Provider>
  );
}
