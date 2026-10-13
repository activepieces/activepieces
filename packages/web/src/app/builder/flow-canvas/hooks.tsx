import { Permission, isNil } from '@activepieces/core-utils';
import {
  FlowDraftUpdatedEvent,
  FlowRunStatus,
  WebsocketClientEvent,
  RunEnvironment,
  isFlowRunStateTerminal,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { useLocation, usePrevious } from 'react-use';
import { toast } from 'sonner';
import { useDebouncedCallback } from 'use-debounce';

import { useEmbedding } from '@/components/providers/embed-provider';
import { useSocket } from '@/components/providers/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunsApi, flowRunUtils } from '@/features/flow-runs';
import { flowsApi } from '@/features/flows';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { editorSession } from '@/lib/editor-session';

import { useBuilderStateContext } from '../builder-hooks';
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

const useRefreshDraftOnPush = () => {
  const socket = useSocket();
  const [flowId, refreshDraft] = useBuilderStateContext((state) => [
    state.flow.id,
    state.refreshDraft,
  ]);
  useEffect(() => {
    const refreshOnPush = (event: FlowDraftUpdatedEvent) => {
      if (
        event.flowId !== flowId ||
        event.editorSessionId === editorSession.getId()
      ) {
        return;
      }
      refreshDraft()
        .then(() => {
          toast.info(
            t(
              'This flow was changed in a different tab or by a different editor. You see the newest version.',
            ),
            { id: 'flow-draft-refreshed' },
          );
        })
        .catch(() => undefined);
    };
    socket.on(WebsocketClientEvent.FLOW_DRAFT_UPDATED, refreshOnPush);
    return () => {
      socket.off(WebsocketClientEvent.FLOW_DRAFT_UPDATED, refreshOnPush);
    };
  }, [socket, flowId, refreshDraft]);
};

const useRefreshDraftOnReconnectAndReturn = () => {
  const socket = useSocket();
  const refreshDraft = useBuilderStateContext((state) => state.refreshDraft);
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

export const useSwitchToDraft = () => {
  const [flowVersion, setVersion, clearRun, setFlow] = useBuilderStateContext(
    (state) => [
      state.flowVersion,
      state.setVersion,
      state.clearRun,
      state.setFlow,
    ],
  );
  const socket = useSocket();
  const { checkAccess } = useAuthorization();
  const userHasPermissionToEditFlow = checkAccess(Permission.WRITE_FLOW);

  const { mutate: switchToDraft, isPending: isSwitchingToDraftPending } =
    useMutation({
      mutationFn: async () => {
        const flow = await flowsApi.get(flowVersion.flowId);
        return flow;
      },
      onSuccess: (flow) => {
        setFlow(flow);
        setVersion(flow.version);
        clearRun(userHasPermissionToEditFlow);
        socket.removeAllListeners(WebsocketClientEvent.UPDATE_RUN_PROGRESS);
      },
      // surface the failure instead of silently keeping a stale draft, which
      // matters most on the lock take-over path where the refresh replaces a
      // full-page reload
      onError: () => internalErrorToast(),
    });
  return {
    switchToDraft,
    isSwitchingToDraftPending,
  };
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
  useRefreshDraftOnPush,
  useRefreshDraftOnReconnectAndReturn,
  useIsFocusInsideListMapperModeInput,
  useFocusOnStep,
  useResizeCanvas,
  useSwitchToDraft,
  useListenToExistingRun,
};
