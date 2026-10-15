import { useCallback, useEffect, useRef } from 'react';

import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext, useBuilderStore } from '../../builder-hooks';
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
  const store = useBuilderStore();
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

  const { lockedBy, acquiring, takeOver } = useResourceLock({
    resourceId: flowId,
    onTakeOver: openDraft,
    onLockFreed,
    beforeRelease: savePendingEdits,
  });

  const blockedByLock = !!lockedBy || acquiring;
  useEffect(() => {
    if (blockedByLock && !readonly) {
      readonlySetByLock.current = true;
      setReadOnly(true);
    }
    if (!blockedByLock && readonlySetByLock.current) {
      readonlySetByLock.current = false;
      setReadOnly(!store.getState().showsNewestVersion());
    }
  }, [blockedByLock, readonly, setReadOnly, store]);

  return { lockedBy, takeOver };
}

export { useFlowLock };
