import { useRef } from 'react';
import { useSearchParams } from 'react-router-dom';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import { NEW_FLOW_QUERY_PARAM } from '@/lib/utils';
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
  projectHooks.useReloadPageIfProjectIdChanged(props.flow.projectId);
  const [queryParams] = useSearchParams();
  if (!storeRef.current) {
    storeRef.current = createBuilderStore(
      {
        ...props,
        readonly,
        sampleData,
      },
      queryParams.get(NEW_FLOW_QUERY_PARAM) === 'true',
    );
  }
  return (
    <BuilderStateContext.Provider value={storeRef.current}>
      {children}
    </BuilderStateContext.Provider>
  );
}
