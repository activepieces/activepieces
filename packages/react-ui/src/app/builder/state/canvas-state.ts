import { StoreApi } from 'zustand';

import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { RightSideBarType } from '@/lib/types';
import { FlowTriggerType, isNil } from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';
import { flowCanvasUtils } from '../flow-canvas/utils/flow-canvas-utils';

export type CanvasState = {
  readonly: boolean;
  hideTestWidget: boolean;
  rightSidebar: RightSideBarType;
  selectedStep: string | null;
  activeDraggingStep: string | null;
  selectedBranchIndex: number | null;
  showMinimap: boolean;
  setShowMinimap: (showMinimap: boolean) => void;
  setSelectedBranchIndex: (index: number | null) => void;
  exitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  removeStepSelection: () => void;
  selectStepByName: (stepName: string) => void;
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

  return {
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
    selectStepByName: (selectedStep: string) => {
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

        return {
          openedPieceSelectorStepNameOrAddButtonId: isEmptyTrigger
            ? 'trigger'
            : null,
          selectedStep,
          rightSidebar,
          selectedBranchIndex: null,
          selectedNodes,
          chatDrawerOpenSource: null,
        };
      });
    },
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
  };
};

const DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE = 'defaultPanningMode';
function getPanningModeFromLocalStorage(): 'grab' | 'pan' {
  return localStorage.getItem(DEFAULT_PANNING_MODE_KEY_IN_LOCAL_STORAGE) ===
    'grab'
    ? 'grab'
    : 'pan';
}
