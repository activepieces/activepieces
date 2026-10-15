import { useCallback, useEffect, useRef } from 'react';

import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasHooks } from '../hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.setReadOnly,
  ]);
  const savePendingEdits = useBuilderStateContext(
    (state) => state.savePendingEdits,
  );
  const readonlySetByLock = useRef(false);
  const { openDraft } = flowCanvasHooks.useOpenDraft();
  const refreshDraftAndMakeNewDraftEditable =
    flowCanvasHooks.useRefreshDraftAndMakeNewDraftEditable();

  const onLockFreed = useCallback(async () => {
    const applied = await refreshDraftAndMakeNewDraftEditable();
    if (!applied) {
      readonlySetByLock.current = false;
    }
  }, [refreshDraftAndMakeNewDraftEditable]);

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: flowId,
    onTakeOver: openDraft,
    onLockFreed,
    beforeRelease: savePendingEdits,
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
