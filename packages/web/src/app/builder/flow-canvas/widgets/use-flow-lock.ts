import { useCallback, useEffect, useRef } from 'react';

import { flowsApi } from '@/features/flows';
import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly, setFlow, setVersion] =
    useBuilderStateContext((state) => [
      state.readonly,
      state.flow.id,
      state.setReadOnly,
      state.setFlow,
      state.setVersion,
    ]);
  const readonlySetByLock = useRef(false);

  const refreshFlowAfterTakeOver = useCallback(async () => {
    const flow = await flowsApi.get(flowId);
    setFlow(flow);
    setVersion(flow.version);
    setReadOnly(false);
  }, [flowId, setFlow, setReadOnly, setVersion]);

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: flowId,
    onTakeOver: refreshFlowAfterTakeOver,
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
