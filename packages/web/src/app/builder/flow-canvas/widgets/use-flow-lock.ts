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
