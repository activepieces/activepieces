import { isNil, Permission } from '@activepieces/core-utils';
import { FlowVersionState } from '@activepieces/shared';
import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';

import { useAuthorization } from '@/hooks/authorization-hooks';
import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasHooks } from '../hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.setReadOnly,
  ]);
  const run = useBuilderStateContext((state) => state.run);
  const [showsNewestVersion, refreshDraft] = useBuilderStateContext((state) => [
    state.flowVersion.state === FlowVersionState.DRAFT ||
      state.flowVersion.id === state.flow.version.id,
    state.refreshDraft,
  ]);
  const readonlySetByLock = useRef(false);
  const navigate = useNavigate();
  const { switchToDraft } = flowCanvasHooks.useSwitchToDraft();
  const { checkAccess } = useAuthorization();
  const canEditFlow = checkAccess(Permission.WRITE_FLOW);

  // refresh the flow in place after a successful take-over; a full-page
  // reload would break the embed SDK handshake inside an iframe. When viewing
  // a run, mirror EditFlowOrViewDraftButton: navigate to the flow
  // (client-side, embed-safe) instead of editing a draft under the run view.
  // Branch on the builder run state, not the URL: embed mounts a memory
  // router, so window.location never reflects the in-app route.
  const onTakeOver = useCallback(() => {
    if (!isNil(run)) {
      navigate(`/flows/${flowId}`);
    } else if (showsNewestVersion) {
      refreshDraft()
        .then(() => setReadOnly(!canEditFlow))
        .catch(() => undefined);
    } else {
      switchToDraft();
    }
  }, [
    run,
    navigate,
    flowId,
    showsNewestVersion,
    refreshDraft,
    setReadOnly,
    canEditFlow,
    switchToDraft,
  ]);

  const { lockedBy, takeOver } = useResourceLock({
    resourceId: flowId,
    onTakeOver,
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
