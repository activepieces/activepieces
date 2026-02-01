import { useQueryClient } from '@tanstack/react-query';
import { useRef } from 'react';

import {
  BuilderInitialState,
  BuilderStateContext,
  BuilderStore,
  createBuilderStore,
} from '@/app/builder/builder-hooks';
import { useSocket } from '@/components/socket-provider';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { projectHooks } from '@/hooks/project-collection';
import { Permission } from '@activepieces/shared';

type BuilderStateProviderProps = Omit<
  React.PropsWithChildren<BuilderInitialState>,
  'socket' | 'queryClient'
>;

export function BuilderStateProvider({
  children,
  outputSampleData: sampleData,
  inputSampleData: sampleDataInput,
  ...props
}: BuilderStateProviderProps) {
  const storeRef = useRef<BuilderStore>();
  const { checkAccess } = useAuthorization();
  const readonly = !checkAccess(Permission.WRITE_FLOW) || props.readonly;
  projectHooks.useReloadPageIfProjectIdChanged(props.flow.projectId);
  const socket = useSocket();
  const queryClient = useQueryClient();
  if (!storeRef.current) {
    storeRef.current = createBuilderStore({
      ...props,
      readonly,
      outputSampleData: sampleData,
      inputSampleData: sampleDataInput,
      socket,
      queryClient,
    });
  }

  return (
    <BuilderStateContext.Provider value={storeRef.current}>
      {children}
    </BuilderStateContext.Provider>
  );
}
