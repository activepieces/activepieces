import { isNil } from '@activepieces/core-utils';
import { FlowTriggerType } from '@activepieces/shared';
import { StoreApi } from 'zustand';

import { RightSideBarType } from '@/app/builder/types';
import { flowRunUtils } from '@/features/flow-runs';

import { BuilderState } from '../builder-hooks';
import { CanvasOrientation } from '../flow-canvas/utils/types';

export type StepDataPanelView = 'drawer' | 'split';

export type CanvasState = {
  canvasOrientation: CanvasOrientation;
  setCanvasOrientation: (orientation: CanvasOrientation) => void;
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
  recentlyChangedSteps: Record<string, number>;
  clearExpiredChangedSteps: () => void;
};

type CanvasStateInitialState = Pick<
  BuilderState,
  'readonly' | 'hideTestWidget' | 'run' | 'flowVersion'
>;

export const createCanvasState = (
  initialState: CanvasStateInitialState,
  set: StoreApi<BuilderState>['setState'],
): CanvasState => {
  // Opening a run jumps straight to the step that needs attention; opening a
  // flow for editing selects nothing — the user opens step settings themselves.
  const failedStepNameInRun = initialState.run?.steps
    ? flowRunUtils.findLastStepWithStatus(
        initialState.run.status,
        initialState.run.steps,
      )
    : null;
  return {
    canvasOrientation: getCanvasOrientationFromLocalStorage(),
    setCanvasOrientation: (orientation: CanvasOrientation) => {
      localStorage.setItem(
        CANVAS_ORIENTATION_KEY_IN_LOCAL_STORAGE,
        orientation,
      );
      return set(() => ({
        canvasOrientation: orientation,
      }));
    },
    showMinimap: false,
    setShowMinimap: (showMinimap: boolean) => set({ showMinimap }),
    readonly: initialState.readonly,
    hideTestWidget: initialState.hideTestWidget ?? false,
    selectedStep: failedStepNameInRun,
    activeDraggingStep: null,
    rightSidebar: failedStepNameInRun
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
    recentlyChangedSteps: {},
    clearExpiredChangedSteps: () =>
      set((state) => {
        const now = Date.now();
        const kept = Object.entries(state.recentlyChangedSteps).filter(
          ([, expiry]) => expiry > now,
        );
        if (kept.length === Object.keys(state.recentlyChangedSteps).length) {
          return state;
        }
        return { recentlyChangedSteps: Object.fromEntries(kept) };
      }),
  };
};

const CANVAS_ORIENTATION_KEY_IN_LOCAL_STORAGE = 'ap.builder.canvasOrientation';
function getCanvasOrientationFromLocalStorage(): CanvasOrientation {
  return localStorage.getItem(CANVAS_ORIENTATION_KEY_IN_LOCAL_STORAGE) ===
    'horizontal'
    ? 'horizontal'
    : 'vertical';
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
