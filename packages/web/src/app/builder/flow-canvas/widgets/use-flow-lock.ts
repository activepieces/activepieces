import { tryCatch } from '@activepieces/core-utils';
import { LockerKind } from '@activepieces/shared';
import { useQueryClient } from '@tanstack/react-query';
import { useCallback, useEffect, useRef } from 'react';

import { flowsApi } from '@/features/flows';
import { useResourceLock } from '@/hooks/use-resource-lock';
import { authenticationSession } from '@/lib/authentication-session';

import { useBuilderStateContext } from '../../builder-hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly, setVersion] = useBuilderStateContext(
    (state) => [
      state.readonly,
      state.flow.id,
      state.setReadOnly,
      state.setVersion,
    ],
  );
  const readonlySetByLock = useRef(false);
  const queryClient = useQueryClient();

  // When the chat agent finishes editing this flow, pull the latest version so the
  // canvas reflects the agent's changes the moment it releases its lock.
  const handleUnlocked = useCallback(
    ({ lockerKind }: { lockerKind?: LockerKind }) => {
      if (lockerKind !== LockerKind.AI) {
        return;
      }
      void (async () => {
        const projectId = authenticationSession.getProjectId();
        await queryClient.invalidateQueries({
          queryKey: ['flow', flowId, projectId],
        });
        const { data: flow } = await tryCatch(() => flowsApi.get(flowId));
        if (flow) {
          setVersion(flow.version);
        }
      })();
    },
    [flowId, queryClient, setVersion],
  );

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: flowId,
    onUnlocked: handleUnlocked,
  });

  useEffect(() => {
    if (lockedBy && !readonly) {
      readonlySetByLock.current = true;
      setReadOnly(true);
    }
    if (!lockedBy && readonlySetByLock.current) {
      readonlySetByLock.current = false;
      setReadOnly(false);
    }
  }, [lockedBy, readonly, setReadOnly]);

  return { lockedBy, takeOver };
}

export { useFlowLock };
