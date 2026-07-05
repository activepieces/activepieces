import { useCallback, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useLocation } from 'react-use';

import { useResourceLock } from '@/hooks/use-resource-lock';

import { useBuilderStateContext } from '../../builder-hooks';
import { flowCanvasHooks } from '../hooks';

function useFlowLock() {
  const [readonly, flowId, setReadOnly] = useBuilderStateContext((state) => [
    state.readonly,
    state.flow.id,
    state.setReadOnly,
  ]);
  const readonlySetByLock = useRef(false);
  const location = useLocation();
  const navigate = useNavigate();
  const { switchToDraft } = flowCanvasHooks.useSwitchToDraft();

  // refresh the flow in place after a successful take-over; a full-page
  // reload would break the embed SDK handshake inside an iframe. On the
  // runs page, mirror EditFlowOrViewDraftButton: navigate to the flow
  // (client-side, embed-safe) instead of editing a draft under a /runs URL
  const onTakeOver = useCallback(() => {
    if (location.pathname?.includes('/runs')) {
      navigate(`/flows/${flowId}`);
    } else {
      switchToDraft();
    }
  }, [location.pathname, navigate, flowId, switchToDraft]);

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
