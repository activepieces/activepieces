import { Permission, isNil, tryCatch } from '@activepieces/core-utils';
import {
  FlowDraftUpdatedEvent,
  FlowRunStatus,
  FlowVersionState,
  WebsocketClientEvent,
  RunEnvironment,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { useCallback, useEffect, useRef } from 'react';
import { NavigateFunction, useNavigate } from 'react-router-dom';
import { useLocation, usePrevious } from 'react-use';
import { useDebouncedCallback } from 'use-debounce';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunsApi, flowRunUtils } from '@/features/flow-runs';
import { flowsApi } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { editorSession } from '@/lib/editor-session';

import {
  BuilderStore,
  useBuilderStateContext,
  useBuilderStore,
} from '../builder-hooks';
import { textMentionUtils } from '../piece-properties/text-input-with-mentions/text-input-utils';

import { flowCanvasUtils } from './utils/flow-canvas-utils';

const useSetSocketListener = (refetchPiece: () => void) => {
  const socket = useSocket();
  const [run] = useBuilderStateContext((state) => [state.run]);
  useEffect(() => {
    socket.on(WebsocketClientEvent.REFRESH_PIECE, () => {
      refetchPiece();
    });
    return () => {
      socket.removeAllListeners(WebsocketClientEvent.REFRESH_PIECE);
    };
  }, [socket.id, run?.id]);
};

const useListenToExistingRun = () => {
  const [run, setRun, flowVersion] = useBuilderStateContext((state) => [
    state.run,
    state.setRun,
    state.flowVersion,
  ]);
  const location = useLocation();
  const inRunsPage = location.pathname?.includes('/runs');
  useQuery({
    queryKey: ['refetched-run', run?.id],
    queryFn: async () => {
      if (isNil(run)) {
        return null;
      }
      const flowRun = await flowRunsApi.getPopulated(run.id);
      setRun(flowRun, flowVersion);
    },
    enabled:
      !isNil(run) &&
      run.environment === RunEnvironment.PRODUCTION &&
      !isFlowRunStateTerminal({
        status: run.status,
        ignoreInternalError: false,
      }) &&
      inRunsPage,
    refetchInterval: 5000,
  });
};

const useShowBuilderIsSavingWarningBeforeLeaving = () => {
  const {
    embedState: { isEmbedded },
  } = useEmbedding();
  const isSaving = useBuilderStateContext((state) => state.saving);
  useEffect(() => {
    if (isEmbedded) {
      return;
    }
    const message = t(
      'Leaving this page while saving will discard your changes, are you sure you want to leave?',
    );
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isSaving) {
        e.preventDefault();
        e.returnValue = message;
        return message;
      }
    };

    if (isSaving) {
      window.addEventListener('beforeunload', handleBeforeUnload);
    }

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [isSaving, isEmbedded]);
};

const useFlushPendingEditsOnLeave = () => {
  const flushPendingEdits = useBuilderStateContext(
    (state) => state.flushPendingEdits,
  );
  useEffect(() => {
    const flushWhenHidden = () => {
      if (document.visibilityState === 'hidden') {
        flushPendingEdits();
      }
    };
    document.addEventListener('visibilitychange', flushWhenHidden);
    return () => {
      document.removeEventListener('visibilitychange', flushWhenHidden);
      flushPendingEdits();
    };
  }, [flushPendingEdits]);
};

const useRefreshDraftAndMakeNewDraftEditable = () => {
  const store = useBuilderStore();
  const { checkAccess } = useAuthorization();
  const canEditFlow = checkAccess(Permission.WRITE_FLOW);
  return useCallback(async () => {
    const { flowVersion: versionBeforeRefresh, refreshDraft } =
      store.getState();
    const applied = await refreshDraft();
    const { flowVersion: versionAfterRefresh, setReadOnly } = store.getState();
    if (
      applied &&
      versionBeforeRefresh.state === FlowVersionState.LOCKED &&
      versionAfterRefresh.state === FlowVersionState.DRAFT
    ) {
      setReadOnly(!canEditFlow);
    }
    return applied;
  }, [store, canEditFlow]);
};

const useRefreshDraftOnPush = () => {
  const socket = useSocket();
  const flowId = useBuilderStateContext((state) => state.flow.id);
  const refreshDraft = useRefreshDraftAndMakeNewDraftEditable();
  useEffect(() => {
    const refreshOnPush = (event: FlowDraftUpdatedEvent) => {
      if (
        event.flowId !== flowId ||
        event.editorSessionId === editorSession.getId()
      ) {
        return;
      }
      refreshDraft().catch(() => undefined);
    };
    socket.on(WebsocketClientEvent.FLOW_DRAFT_UPDATED, refreshOnPush);
    return () => {
      socket.off(WebsocketClientEvent.FLOW_DRAFT_UPDATED, refreshOnPush);
    };
  }, [socket, flowId, refreshDraft]);
};

const useRefreshDraftOnReconnectAndReturn = () => {
  const socket = useSocket();
  const refreshDraft = useRefreshDraftAndMakeNewDraftEditable();
  useEffect(() => {
    let socketHasConnected = socket.connected;
    const refreshOnReconnect = () => {
      if (socketHasConnected) {
        refreshDraft().catch(() => undefined);
      }
      socketHasConnected = true;
    };
    const refreshWhenVisible = () => {
      if (document.visibilityState === 'visible') {
        refreshDraft().catch(() => undefined);
      }
    };
    socket.on('connect', refreshOnReconnect);
    document.addEventListener('visibilitychange', refreshWhenVisible);
    return () => {
      socket.off('connect', refreshOnReconnect);
      document.removeEventListener('visibilitychange', refreshWhenVisible);
    };
  }, [socket, refreshDraft]);
};

const useOpenDraft = () => {
  const store = useBuilderStore();
  const navigate = useNavigate();
  const socket = useSocket();
  const { checkAccess } = useAuthorization();
  const canEditFlow = checkAccess(Permission.WRITE_FLOW);
  const { mutateAsync, isPending } = useMutation({
    mutationFn: () =>
      openNewestVersionForEdit({ store, navigate, socket, canEditFlow }),
  });
  const openDraft = useCallback(
    () => mutateAsync().catch(() => undefined),
    [mutateAsync],
  );
  return { openDraft, isOpeningDraft: isPending };
};

const useIsFocusInsideListMapperModeInput = ({
  containerRef,
  setIsFocusInsideListMapperModeInput,
  isFocusInsideListMapperModeInput,
}: {
  containerRef: React.RefObject<HTMLDivElement | null>;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
  isFocusInsideListMapperModeInput: boolean;
}) => {
  useEffect(() => {
    const focusInListener = () => {
      const focusedElement = document.activeElement;
      const isFocusedInside = !!containerRef.current?.contains(focusedElement);
      const isFocusedInsideDataSelector =
        !isNil(document.activeElement) &&
        document.activeElement instanceof HTMLElement &&
        textMentionUtils.isDataSelectorOrChildOfDataSelector(
          document.activeElement,
        );
      setIsFocusInsideListMapperModeInput(
        isFocusedInside ||
          (isFocusedInsideDataSelector && isFocusInsideListMapperModeInput),
      );
    };
    document.addEventListener('focusin', focusInListener);
    return () => {
      document.removeEventListener('focusin', focusInListener);
    };
  }, [setIsFocusInsideListMapperModeInput, isFocusInsideListMapperModeInput]);
};
export const useFocusOnStep = () => {
  const [currentRun, selectStep, userManuallySelectedStepDuringRun] =
    useBuilderStateContext((state) => [
      state.run,
      state.selectStepByName,
      state.userManuallySelectedStepDuringRun,
    ]);

  const previousStatus = usePrevious(currentRun?.status);
  const currentStep = flowRunUtils.findLastStepWithStatus(
    previousStatus ?? FlowRunStatus.RUNNING,
    currentRun?.steps ?? {},
  );

  const { fitView } = useReactFlow();
  const focusCurrentStep = useDebouncedCallback(() => {
    if (userManuallySelectedStepDuringRun) {
      return;
    }
    if (!isNil(currentStep)) {
      fitView(flowCanvasUtils.createFocusStepInGraphParams(currentStep));
      selectStep(currentStep, { fromAutoFocus: true });
    }
  }, 500);

  useEffect(() => {
    focusCurrentStep();
  }, [currentStep, selectStep, fitView, userManuallySelectedStepDuringRun]);
};

export const useResizeCanvas = (
  containerRef: React.RefObject<HTMLDivElement | null>,
  setHasCanvasBeenInitialised: (hasCanvasBeenInitialised: boolean) => void,
) => {
  const containerSizeRef = useRef({
    width: 0,
    height: 0,
  });
  const { getViewport, setViewport } = useReactFlow();

  useEffect(() => {
    if (!containerRef.current) return;
    const resizeObserver = new ResizeObserver((entries) => {
      const { width, height } = entries[0].contentRect;
      setHasCanvasBeenInitialised(true);
      const { x, y, zoom } = getViewport();
      if (containerRef.current && width !== containerSizeRef.current.width) {
        const newX = x + (width - containerSizeRef.current.width) / 2;
        setViewport({ x: newX, y, zoom });
      }
      containerSizeRef.current = {
        width,
        height,
      };
    });
    resizeObserver.observe(containerRef.current);
    return () => {
      resizeObserver.disconnect();
    };
  }, [setViewport, getViewport]);
};

export const flowCanvasHooks = {
  useSetSocketListener,
  useShowBuilderIsSavingWarningBeforeLeaving,
  useFlushPendingEditsOnLeave,
  useRefreshDraftAndMakeNewDraftEditable,
  useRefreshDraftOnPush,
  useRefreshDraftOnReconnectAndReturn,
  useIsFocusInsideListMapperModeInput,
  useFocusOnStep,
  useResizeCanvas,
  useOpenDraft,
  useListenToExistingRun,
};

async function openNewestVersionForEdit({
  store,
  navigate,
  socket,
  canEditFlow,
}: {
  store: BuilderStore;
  navigate: NavigateFunction;
  socket: Socket;
  canEditFlow: boolean;
}): Promise<void> {
  const { run, flow, showsNewestVersion, refreshDraft } = store.getState();
  if (!isNil(run)) {
    navigate(`/flows/${flow.id}`);
    return;
  }
  if (showsNewestVersion()) {
    const applied = await refreshDraft();
    if (applied) {
      store.getState().setReadOnly(!canEditFlow);
    }
    return;
  }
  const { data: newestFlow, error } = await tryCatch(() =>
    flowsApi.get(flow.id),
  );
  if (error !== null) {
    internalErrorToast();
    return;
  }
  const { setFlow, setVersion, clearRun } = store.getState();
  setFlow(newestFlow);
  setVersion(newestFlow.version);
  clearRun(canEditFlow);
  socket.removeAllListeners(WebsocketClientEvent.UPDATE_RUN_PROGRESS);
}

type Socket = ReturnType<typeof useSocket>;
