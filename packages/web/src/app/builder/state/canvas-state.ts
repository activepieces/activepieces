import { FlowTriggerType, isNil } from '@activepieces/shared';
import { StoreApi } from 'zustand';

import { RightSideBarType } from '@/app/builder/types';
import { flowRunUtils } from '@/features/flow-runs';

import { BuilderState } from '../builder-hooks';
import { flowCanvasUtils } from '../flow-canvas/utils/flow-canvas-utils';
import { CanvasOrientation } from '../flow-canvas/utils/types';

export type StepDataPanelView = 'drawer' | 'split';

export type StepPositionOverrides = Record<string, { x: number; y: number }>;

export type CanvasState = {
  canvasOrientation: CanvasOrientation;
  setCanvasOrientation: (orientation: CanvasOrientation) => void;
  stepPositionOverrides: StepPositionOverrides;
  setStepPositionOverride: (params: {
    stepName: string;
    position: { x: number; y: number };
  }) => void;
  clearStepPositionOverride: (stepName: string) => void;
  resetStepPositionOverrides: () => void;
  readonly: boolean;
  hideTestWidget: boolean;
  rightSidebar: RightSideBarType;
  selectedStep: string | null;
  activeDraggingStep: string | null;
  selectedBranchIndex: number | null;
  userManuallySelectedStepDuringRun: boolean;
  showMinimap: boolean;
  setShowMinimap: (showMinimap: boolean) => void;
  setSelectedBranchIndex: (index: number | null) => void;
  exitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  removeStepSelection: () => void;
  selectStepByName: (
    stepName: string,
    options?: { fromAutoFocus?: boolean },
  ) => void;
  resumeLiveFollow: () => void;
  setActiveDraggingStep: (stepName: string | null) => void;
  setReadOnly: (readOnly: boolean) => void;
  selectedNodes: string[];
  setSelectedNodes: (nodes: string[]) => void;
  panningMode: 'grab' | 'pan';
  setPanningMode: (mode: 'grab' | 'pan') => void;
  isFocusInsideListMapperModeInput: boolean;
  setIsFocusInsideListMapperModeInput: (
    isFocusInsideListMapperModeInput: boolean,
  ) => void;
  deselectStep: () => void;
  stepDataPanelView: StepDataPanelView;
  setStepDataPanelView: (view: StepDataPanelView) => void;
  isStepDataPanelOpen: boolean;
  setStepDataPanelOpen: (open: boolean) => void;
};

type CanvasStateInitialState = Pick<
  BuilderState,
  'readonly' | 'hideTestWidget' | 'run' | 'flowVersion'
>;

export const createCanvasState = (
  initialState: CanvasStateInitialState,
  set: StoreApi<BuilderState>['setState'],
): CanvasState => {
  const failedStepNameInRun = initialState.run?.steps
    ? flowRunUtils.findLastStepWithStatus(
        initialState.run.status,
        initialState.run.steps,
      )
    : null;
  const initiallySelectedStep = flowCanvasUtils.determineInitiallySelectedStep(
    failedStepNameInRun,
    initialState.flowVersion,
  );
  const isEmptyTriggerInitiallySelected =
    initiallySelectedStep === 'trigger' &&
    initialState.flowVersion.trigger.type === FlowTriggerType.EMPTY;
  const flowId = initialState.flowVersion.flowId;
  const initialOrientation = getCanvasOrientationFromLocalStorage();
  return {
    canvasOrientation: initialOrientation,
    setCanvasOrientation: (orientation: CanvasOrientation) => {
      localStorage.setItem(
        CANVAS_ORIENTATION_KEY_IN_LOCAL_STORAGE,
        orientation,
      );
      return set(() => ({
        canvasOrientation: orientation,
        stepPositionOverrides: getStepPositionOverridesFromLocalStorage({
          flowId,
          orientation,
        }),
      }));
    },
    stepPositionOverrides: getStepPositionOverridesFromLocalStorage({
      flowId,
      orientation: initialOrientation,
    }),
    setStepPositionOverride: ({ stepName, position }) => {
      return set((state) => {
        const stepPositionOverrides = {
          ...state.stepPositionOverrides,
          [stepName]: position,
        };
        saveStepPositionOverridesToLocalStorage({
          flowId,
          orientation: state.canvasOrientation,
          stepPositionOverrides,
        });
        return { stepPositionOverrides };
      });
    },
    clearStepPositionOverride: (stepName: string) => {
      return set((state) => {
        if (isNil(state.stepPositionOverrides[stepName])) {
          return {};
        }
        const stepPositionOverrides = Object.fromEntries(
          Object.entries(state.stepPositionOverrides).filter(
            ([name]) => name !== stepName,
          ),
        );
        saveStepPositionOverridesToLocalStorage({
          flowId,
          orientation: state.canvasOrientation,
          stepPositionOverrides,
        });
        return { stepPositionOverrides };
      });
    },
    resetStepPositionOverrides: () => {
      return set((state) => {
        saveStepPositionOverridesToLocalStorage({
          flowId,
          orientation: state.canvasOrientation,
          stepPositionOverrides: {},
        });
        return { stepPositionOverrides: {} };
      });
    },
    showMinimap: false,
    setShowMinimap: (showMinimap: boolean) => set({ showMinimap }),
    readonly: initialState.readonly,
    hideTestWidget: initialState.hideTestWidget ?? false,
    selectedStep: initiallySelectedStep,
    activeDraggingStep: null,
    rightSidebar:
      initiallySelectedStep && !isEmptyTriggerInitiallySelected
        ? RightSideBarType.PIECE_SETTINGS
        : RightSideBarType.NONE,
    removeStepSelection: () =>
      set({
        selectedStep: null,
        rightSidebar: RightSideBarType.NONE,
        selectedBranchIndex: null,
      }),

    setActiveDraggingStep: (stepName: string | null) =>
      set({
        activeDraggingStep: stepName,
      }),
    setSelectedBranchIndex: (branchIndex: number | null) =>
      set({
        selectedBranchIndex: branchIndex,
      }),
    setReadOnly: (readonly: boolean) => set({ readonly }),
    renameFlowClientSide: (newName: string) => {
      set((state) => {
        return {
          flowVersion: {
            ...state.flowVersion,
            displayName: newName,
          },
        };
      });
    },
    selectStepByName: (
      selectedStep: string,
      options?: { fromAutoFocus?: boolean },
    ) => {
      set((state) => {
        const selectedNodes = isNil(selectedStep) ? [] : [selectedStep];
        const rightSidebar =
          selectedStep === 'trigger' &&
          state.flowVersion.trigger.type === FlowTriggerType.EMPTY
            ? RightSideBarType.NONE
            : RightSideBarType.PIECE_SETTINGS;

        const isEmptyTrigger =
          selectedStep === 'trigger' &&
          state.flowVersion.trigger.type === FlowTriggerType.EMPTY;

        const userPickedDifferentStepDuringRun =
          !options?.fromAutoFocus &&
          !isNil(state.run) &&
          state.selectedStep !== selectedStep;

        return {
          openedPieceSelectorStepNameOrAddButtonId: isEmptyTrigger
            ? 'trigger'
            : null,
          selectedStep,
          rightSidebar,
          selectedBranchIndex: null,
          selectedNodes,
          chatDrawerOpenSource: null,
          userManuallySelectedStepDuringRun:
            state.userManuallySelectedStepDuringRun ||
            userPickedDifferentStepDuringRun,
        };
      });
    },
    resumeLiveFollow: () =>
      set((state) => {
        if (isNil(state.run) || isNil(state.run.steps)) {
          return { userManuallySelectedStepDuringRun: false };
        }
        return {
          userManuallySelectedStepDuringRun: false,
          loopsIndexes: flowRunUtils.snapLoopsToLatestIteration(
            state.run,
            state.loopsIndexes,
          ),
        };
      }),
    userManuallySelectedStepDuringRun: false,
    exitStepSettings: () =>
      set(() => ({
        rightSidebar: RightSideBarType.NONE,
        selectedStep: null,
        selectedBranchIndex: null,
      })),
    setRightSidebar: (rightSidebar: RightSideBarType) => set({ rightSidebar }),
    selectedBranchIndex: null,
    selectedNodes: [],
    setSelectedNodes: (nodes) => {
      return set(() => ({
        selectedNodes: nodes,
      }));
    },
    deselectStep: () => {
      return set(() => ({
        rightSidebar: RightSideBarType.NONE,
        selectedBranchIndex: null,
        selectedStep: null,
      }));
    },
    panningMode: getPanningModeFromLocalStorage(),
    setPanningMode: (mode: 'grab' | 'pan') => {
      localStorage.setItem(DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE, mode);
      return set(() => ({
        panningMode: mode,
      }));
    },
    isFocusInsideListMapperModeInput: false,
    setIsFocusInsideListMapperModeInput: (
      isFocusInsideListMapperModeInput: boolean,
    ) => {
      return set(() => ({
        isFocusInsideListMapperModeInput,
      }));
    },
    stepDataPanelView: getStepDataPanelViewFromLocalStorage(),
    setStepDataPanelView: (view: StepDataPanelView) => {
      localStorage.setItem(STEP_DATA_PANEL_VIEW_KEY_IN_LOCAL_STORAGE, view);
      return set(() => ({
        stepDataPanelView: view,
      }));
    },
    isStepDataPanelOpen:
      getTestPanelOpenFromLocalStorage() || !isNil(initialState.run),
    setStepDataPanelOpen: (open: boolean) => {
      localStorage.setItem(
        TEST_PANEL_OPEN_KEY_IN_LOCAL_STORAGE,
        open ? 'open' : 'closed',
      );
      return set(() => ({
        isStepDataPanelOpen: open,
      }));
    },
  };
};

const CANVAS_ORIENTATION_KEY_IN_LOCAL_STORAGE = 'ap.builder.canvasOrientation';
function getCanvasOrientationFromLocalStorage(): CanvasOrientation {
  return localStorage.getItem(CANVAS_ORIENTATION_KEY_IN_LOCAL_STORAGE) ===
    'horizontal'
    ? 'horizontal'
    : 'vertical';
}

const STEP_POSITIONS_KEY_PREFIX_IN_LOCAL_STORAGE = 'ap.builder.stepPositions';
function getStepPositionOverridesStorageKey({
  flowId,
  orientation,
}: {
  flowId: string;
  orientation: CanvasOrientation;
}): string {
  return `${STEP_POSITIONS_KEY_PREFIX_IN_LOCAL_STORAGE}.${flowId}.${orientation}`;
}

function getStepPositionOverridesFromLocalStorage({
  flowId,
  orientation,
}: {
  flowId: string;
  orientation: CanvasOrientation;
}): StepPositionOverrides {
  const raw = localStorage.getItem(
    getStepPositionOverridesStorageKey({ flowId, orientation }),
  );
  if (isNil(raw)) {
    return {};
  }
  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== 'object' || isNil(parsed)) {
      return {};
    }
    return Object.entries(parsed).reduce<StepPositionOverrides>(
      (overrides, [stepName, position]) => {
        if (isXYPosition(position)) {
          return {
            ...overrides,
            [stepName]: { x: position.x, y: position.y },
          };
        }
        return overrides;
      },
      {},
    );
  } catch {
    return {};
  }
}

function isXYPosition(value: unknown): value is { x: number; y: number } {
  return (
    typeof value === 'object' &&
    !isNil(value) &&
    'x' in value &&
    'y' in value &&
    typeof value.x === 'number' &&
    typeof value.y === 'number'
  );
}

function saveStepPositionOverridesToLocalStorage({
  flowId,
  orientation,
  stepPositionOverrides,
}: {
  flowId: string;
  orientation: CanvasOrientation;
  stepPositionOverrides: StepPositionOverrides;
}): void {
  const key = getStepPositionOverridesStorageKey({ flowId, orientation });
  if (Object.keys(stepPositionOverrides).length === 0) {
    localStorage.removeItem(key);
    return;
  }
  localStorage.setItem(key, JSON.stringify(stepPositionOverrides));
}

const DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE = 'defaultPanningMode';
function getPanningModeFromLocalStorage(): 'grab' | 'pan' {
  return localStorage.getItem(DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE) ===
    'grab'
    ? 'grab'
    : 'pan';
}

const STEP_DATA_PANEL_VIEW_KEY_IN_LOCAL_STORAGE = 'ap.builder.testPanelView';
function getStepDataPanelViewFromLocalStorage(): StepDataPanelView {
  return localStorage.getItem(STEP_DATA_PANEL_VIEW_KEY_IN_LOCAL_STORAGE) ===
    'split'
    ? 'split'
    : 'drawer';
}

const TEST_PANEL_OPEN_KEY_IN_LOCAL_STORAGE = 'ap.builder.testPanelOpen';
function getTestPanelOpenFromLocalStorage(): boolean {
  return localStorage.getItem(TEST_PANEL_OPEN_KEY_IN_LOCAL_STORAGE) === 'open';
}
