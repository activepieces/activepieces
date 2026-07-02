import { useEffect, useRef } from 'react';

import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.setReadOnly,
  ]);
  const readonlySetByLock = useRef(false);

  // No refetch on unlock: the agent's edits, publish/status changes and test runs all
  // stream in live (see use-flow-realtime), and that hook does a single silent reconcile
  // on the lock's falling edge. Refetching + setVersion here would reset the canvas
  // (selection/sidebar) — the very "refresh after finishing" we want to avoid.
  const { lockedBy, takeOver } = useResourceLock({
    resourceId: flowId,
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
