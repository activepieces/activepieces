import { useMutation, useQuery } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import { useEffect, useRef } from 'react';
import { ImperativePanelHandle } from 'react-resizable-panels';
import { useLocation, usePrevious } from 'react-use';
import { useDebouncedCallback } from 'use-debounce';

import { useEmbedding } from '@/components/embed-provider';
import { useSocket } from '@/components/socket-provider';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { useAuthorization } from '@/hooks/authorization-hooks';
import { RightSideBarType } from '@/lib/types';
import {
  FlowRunStatus,
  Permission,
  isNil,
  WebsocketClientEvent,
  RunEnvironment,
  isFlowRunStateTerminal,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';
import { textMentionUtils } from '../piece-properties/text-input-with-mentions/text-input-utils';

import { flowCanvasUtils } from './utils/flow-canvas-utils';

export const useAnimateSidebar = (sidebarValue: RightSideBarType) => {
  const handleRef = useRef<ImperativePanelHandle>(null);
  const sidebarClosed = sidebarValue === RightSideBarType.NONE;
  useEffect(() => {
    const sidebarSize = handleRef.current?.getSize() ?? 0;
    if (sidebarClosed) {
      handleRef.current?.resize(0);
    } else if (sidebarSize === 0) {
      handleRef.current?.resize(25);
    }
  }, [handleRef, sidebarValue, sidebarClosed]);
  return handleRef;
};

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
  containerRef: React.RefObject<HTMLDivElement>;
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
  const [currentRun, selectStep] = useBuilderStateContext((state) => [
    state.run,
    state.selectStepByName,
  ]);

  const previousStatus = usePrevious(currentRun?.status);
  const currentStep = flowRunUtils.findLastStepWithStatus(
    previousStatus ?? FlowRunStatus.RUNNING,
    currentRun?.steps ?? {},
  );

  const focusCurrentStep = useDebouncedCallback(() => {
    if (!isNil(currentStep)) {
      fitView(flowCanvasUtils.createFocusStepInGraphParams(currentStep));
      selectStep(currentStep);
    }
  }, 500);

  const { fitView } = useReactFlow();
  useEffect(() => {
    focusCurrentStep();
  }, [currentStep, selectStep, fitView]);
};

export const useResizeCanvas = (
  containerRef: React.RefObject<HTMLDivElement>,
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
  useAnimateSidebar,
  useSetSocketListener,
  useShowBuilderIsSavingWarningBeforeLeaving,
  useIsFocusInsideListMapperModeInput,
  useFocusOnStep,
  useResizeCanvas,
  useSwitchToDraft,
  useListenToExistingRun,
};
