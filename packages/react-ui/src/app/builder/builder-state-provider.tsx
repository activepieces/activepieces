import { useRef } from 'react';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { Permission } from '@activepieces/shared';

type BuilderStateProviderProps = React.PropsWithChildren<BuilderInitialState>;

export function BuilderStateProvider({
  children,
  sampleData,
  sampleDataInput,
  ...props
}: BuilderStateProviderProps) {
  const storeRef = useRef<BuilderStore>();
  const { checkAccess } = useAuthorization();
  const readonly = !checkAccess(Permission.WRITE_FLOW) || props.readonly;
  projectHooks.useReloadPageIfProjectIdChanged(props.flow.projectId);
  if (!storeRef.current) {
    storeRef.current = createBuilderStore({
      ...props,
      readonly,
      sampleData,
      sampleDataInput,
    });
  }

  return (
    <BuilderStateContext.Provider value={storeRef.current}>
      {children}
    </BuilderStateContext.Provider>
  );
}
