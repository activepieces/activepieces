import { useMutation } from '@tanstack/react-query';
import { useReactFlow } from '@xyflow/react';
import { t } from 'i18next';
import {
  createContext,
  useContext,
  useCallback,
  useEffect,
  useRef,
} from 'react';
import { usePrevious } from 'react-use';
import { create, useStore } from 'zustand';
import { useEmbedding } from '@/components/embed-provider';
import { flowsApi } from '@/features/flows/lib/flows-api';
import {
  Permission,
  flowStructureUtil,
  isNil,
  StepLocationRelativeToParent,
  FlowRunStatus,
} from '@activepieces/shared';
import { flowRunUtils } from '../../features/flow-runs/lib/flow-run-utils';
import { useAuthorization } from '../../hooks/authorization-hooks';
import {
  copySelectedNodes,
  deleteSelectedNodes,
  getActionsInClipboard,
  pasteNodes,
  toggleSkipSelectedNodes,
} from './flow-canvas/bulk-actions';
import {
  CanvasShortcuts,
  CanvasShortcutsProps,
} from './flow-canvas/context-menu/canvas-context-menu';
import { flowCanvasConsts } from './flow-canvas/utils/consts';
import { flowCanvasUtils } from './flow-canvas/utils/flow-canvas-utils';
import { textMentionUtils } from './piece-properties/text-input-with-mentions/text-input-utils';
import { createFlowState, FlowState } from './state/flow-state';
import { createPieceSelectorState, PieceSelectorState } from './state/piece-selector-state';
import { createRunState, RunState } from './state/run-state';
import { ChatState, createChatState } from './state/chat-state';
import { CanvasState, createCanvasState } from './state/canvas-state';
import { createStepFormState, StepFormState } from './state/step-form-state';

export const BuilderStateContext = createContext<BuilderStore | null>(null);

export function useBuilderStateContext<T>(
  selector: (state: BuilderState) => T,
): T {
  const store = useContext(BuilderStateContext);
  if (!store)
    throw new Error('Missing BuilderStateContext.Provider in the tree');
  return useStore(store, selector);
}

export type BuilderState = FlowState & PieceSelectorState & RunState & ChatState & CanvasState & StepFormState;
export type BuilderInitialState = Pick<
  BuilderState,
  | 'flow'
  | 'flowVersion'
  | 'readonly'
  | 'hideTestWidget'
  | 'run'
  | 'outputSampleData'
  | 'inputSampleData'
>;

export type BuilderStore = ReturnType<typeof createBuilderStore>;
export const createBuilderStore = (initialState: BuilderInitialState) =>
  create<BuilderState>((set, get) => {
    const flowState = createFlowState(initialState, get, set);
    const pieceSelectorState = createPieceSelectorState(get, set);
    const runState = createRunState(initialState, get, set);
    const chatState = createChatState(set);
    const canvasState = createCanvasState(initialState, set);
    const stepFormState = createStepFormState(set);
    return {
      ...flowState,
      ...runState,
      ...pieceSelectorState,
      ...chatState,
      ...canvasState,
      ...stepFormState,
    };
  });

export const useSwitchToDraft = () => {
  const [flowVersion, setVersion, clearRun, setFlow] = useBuilderStateContext(
    (state) => [
      state.flowVersion,
      state.setVersion,
      state.clearRun,
      state.setFlow,
    ],
  );
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
      },
    });
  return {
    switchToDraft,
    isSwitchingToDraftPending,
  };
};

export const useIsFocusInsideListMapperModeInput = ({
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
  const lastStep = usePrevious(currentStep);

  const { fitView } = useReactFlow();
  useEffect(() => {
    if (!isNil(lastStep) && lastStep !== currentStep && !isNil(currentStep)) {
      setTimeout(() => {
        console.log('focusing on step', currentStep);
        fitView(flowCanvasUtils.createFocusStepInGraphParams(currentStep));
        selectStep(currentStep);
      });
    }
  }, [lastStep, currentStep, selectStep, fitView]);
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
        // Update the viewport to keep content centered without affecting zoom
        setViewport({ x: newX, y, zoom });
      }
      // Adjust x/y values based on the new size and keep the same zoom level
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



export const useShowBuilderIsSavingWarningBeforeLeaving = () => {
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
