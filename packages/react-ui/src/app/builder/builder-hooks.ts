import { useMutation } from '@tanstack/react-query';
import { createContext, useContext } from 'react';
import { create, useStore } from 'zustand';

import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { PromiseQueue } from '@/lib/promise-queue';
import {
  ActionType,
  ExecutionState,
  Flow,
  FlowOperationRequest,
  FlowRun,
  FlowVersion,
  FlowVersionState,
  StepOutput,
  TriggerType,
  flowHelper,
  isNil,
} from '@activepieces/shared';

const flowUpdatesQueue = new PromiseQueue();

export const BuilderStateContext = createContext<BuilderStore | null>(null);

export function useBuilderStateContext<T>(
  selector: (state: BuilderState) => T,
): T {
  const store = useContext(BuilderStateContext);
  if (!store)
    throw new Error('Missing BuilderStateContext.Provider in the tree');
  return useStore(store, selector);
}

export type StepPathWithName = {
  path: [string, number][];
  stepName: string;
};

export enum LeftSideBarType {
  RUNS = 'runs',
  VERSIONS = 'versions',
  RUN_DETAILS = 'run-details',
  AI_COPILOT = 'chat',
  NONE = 'none',
}

export enum RightSideBarType {
  NONE = 'none',
  PIECE_SETTINGS = 'piece-settings',
}

type InsertMentionHandler = (propertyPath: string) => void;

export type BuilderState = {
  flow: Flow;
  flowVersion: FlowVersion;
  readonly: boolean;
  run: FlowRun | null;
  leftSidebar: LeftSideBarType;
  rightSidebar: RightSideBarType;
  selectedStep: StepPathWithName | null;
  canExitRun: boolean;
  activeDraggingStep: string | null;
  allowCanvasPanning: boolean;
  saving: boolean;
  refreshPieceFormSettings: boolean;
  refreshSettings: () => void;
  exitRun: () => void;
  exitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  moveToFolderClientSide: (folderId: string) => void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setLeftSidebar: (leftSidebar: LeftSideBarType) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  applyOperation: (
    operation: FlowOperationRequest,
    onError: () => void,
  ) => void;
  removeStepSelection: () => void;
  selectStepByPath: (path: StepPathWithName) => void;
  selectStepByName: (stepName: string) => void;
  startSaving: () => void;
  setAllowCanvasPanning: (allowCanvasPanning: boolean) => void;
  setActiveDraggingStep: (stepName: string | null) => void;
  setFlow: (flow: Flow) => void;
  exitPieceSelector: () => void;
  setVersion: (flowVersion: FlowVersion) => void;
  insertMention: InsertMentionHandler | null;
  setReadOnly: (readOnly: boolean) => void;
  setInsertMentionHandler: (handler: InsertMentionHandler | null) => void;
};

export type BuilderInitialState = Pick<
  BuilderState,
  'flow' | 'flowVersion' | 'readonly' | 'run' | 'canExitRun'
>;

export type BuilderStore = ReturnType<typeof createBuilderStore>;

export const createBuilderStore = (initialState: BuilderInitialState) =>
  create<BuilderState>((set) => ({
    flow: initialState.flow,
    flowVersion: initialState.flowVersion,
    leftSidebar: initialState.run
      ? LeftSideBarType.RUN_DETAILS
      : LeftSideBarType.NONE,
    readonly: initialState.readonly,
    run: initialState.run,
    saving: false,
    selectedStep: initialState.run
      ? {
          path: [],
          stepName: initialState.flowVersion.trigger.name,
        }
      : null,
    canExitRun: initialState.canExitRun,
    activeDraggingStep: null,
    allowCanvasPanning: true,
    rightSidebar: initialState.run
      ? RightSideBarType.PIECE_SETTINGS
      : RightSideBarType.NONE,
    refreshPieceFormSettings: false,

    removeStepSelection: () =>
      set({ selectedStep: null, rightSidebar: RightSideBarType.NONE }),
    setAllowCanvasPanning: (allowCanvasPanning: boolean) =>
      set({
        allowCanvasPanning,
      }),
    setActiveDraggingStep: (stepName: string | null) =>
      set({
        activeDraggingStep: stepName,
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
    selectStepByName: (stepName: string) => {
      set((state) => {
        const pathToStep = flowHelper
          .getAllSteps(state.flowVersion.trigger)
          .filter((step) =>
            flowHelper.isPartOfInnerFlow({
              parentStep: step,
              childName: stepName,
            }),
          );
        return {
          selectedStep: {
            path: pathToStep
              .filter((p) => p.name !== stepName)
              .map((p) => [p.name, 0]),
            stepName,
          },
          rightSidebar: stepName==="trigger" && state.flowVersion.trigger.type === TriggerType.EMPTY ? RightSideBarType.NONE: RightSideBarType.PIECE_SETTINGS ,
          leftSidebar: !isNil(state.run)
            ? LeftSideBarType.RUN_DETAILS
            : LeftSideBarType.NONE,
        };
      });
    },
    moveToFolderClientSide: (folderId: string) => {
      set((state) => {
        return {
          flow: {
            ...state.flow,
            folderId,
          },
        };
      });
    },
    setFlow: (flow: Flow) => set({ flow }),
    exitRun: () =>
      set({
        run: null,
        readonly: false,
        leftSidebar: LeftSideBarType.NONE,
        rightSidebar: RightSideBarType.NONE,
      }),
    exitStepSettings: () =>
      set({
        rightSidebar: RightSideBarType.NONE,
        selectedStep: null,
      }),
    exitPieceSelector: () =>
      set({
        rightSidebar: RightSideBarType.NONE,
      }),
    selectStepByPath: (path: StepPathWithName) =>
      set((state) => {
        return {
          selectedStep: path,
          leftSidebar: isNil(state.run)
            ? LeftSideBarType.NONE
            : LeftSideBarType.RUN_DETAILS,
          rightSidebar: path
            ? RightSideBarType.PIECE_SETTINGS
            : RightSideBarType.NONE,
        };
      }),
    setRightSidebar: (rightSidebar: RightSideBarType) => set({ rightSidebar }),
    setLeftSidebar: (leftSidebar: LeftSideBarType) => set({ leftSidebar }),
    setRun: async (run: FlowRun, flowVersion: FlowVersion) =>
      set({
        run,
        flowVersion,
        leftSidebar: LeftSideBarType.RUN_DETAILS,
        rightSidebar: RightSideBarType.PIECE_SETTINGS,
        selectedStep: {
          path: [],
          stepName: flowVersion.trigger.name,
        },
        readonly: true,
      }),
    startSaving: () => set({ saving: true }),
    applyOperation: (operation: FlowOperationRequest, onError: () => void) =>
      set((state) => {
        const newFlowVersion = flowHelper.apply(state.flowVersion, operation);
        const updateRequest = async () => {
          set({ saving: true });
          try {
            const updatedFlowVersion = await flowsApi.update(
              state.flow.id,
              operation,
            );
            set((state) => {
              return {
                flowVersion: {
                  ...state.flowVersion,
                  id: updatedFlowVersion.version.id,
                  state: updatedFlowVersion.version.state,
                },
                saving: flowUpdatesQueue.size() !== 0,
              };
            });
          } catch (error) {
            console.error(error);
            flowUpdatesQueue.halt();
            onError();
          }
        };
        flowUpdatesQueue.add(updateRequest);
        return { flowVersion: newFlowVersion };
      }),
    setVersion: (flowVersion: FlowVersion) => {
      set((state) => ({
        flowVersion,
        run: null,
        readonly:
          state.flow.publishedVersionId !== flowVersion.id &&
          flowVersion.state === FlowVersionState.LOCKED,
        leftSidebar: LeftSideBarType.NONE,
        rightSidebar: RightSideBarType.NONE,
      }));
    },
    insertMention: null,
    setInsertMentionHandler: (insertMention: InsertMentionHandler | null) => {
      set({ insertMention });
    },
    refreshSettings: () =>
      set((state) => ({
        refreshPieceFormSettings: !state.refreshPieceFormSettings,
      })),
  }));

export const stepPathToKeyString = (path: StepPathWithName): string => {
  return path.path.map((p) => p.join('-')).join('/') + '/' + path.stepName;
};

function getStepOutputFromExecutionPath({
  stepName,
  selectedPath,
  executionState,
}: {
  stepName: string;
  selectedPath: StepPathWithName | null;
  executionState: ExecutionState | FlowRun | undefined | null;
}): StepOutput | undefined {
  if (isNil(executionState)) {
    return undefined;
  }
  const stateAtPath = constructCurrentStateForEachStep(
    executionState.steps,
    selectedPath,
  );
  return stateAtPath?.[stepName];
}

function constructCurrentStateForEachStep(
  steps: Record<string, StepOutput> | undefined,
  selectedPath: StepPathWithName | null,
): Record<string, StepOutput> {
  const currentState: Record<string, StepOutput> = {};
  Object.entries(steps ?? {}).forEach(([key, value]) => {
    currentState[key] = value;
    if (value.type === ActionType.LOOP_ON_ITEMS && value.output) {
      const [, iteration] = selectedPath?.path.find((p) => p[0] === key) ?? [
        undefined,
        0,
      ];
      const state = constructCurrentStateForEachStep(
        value.output.iterations[iteration],
        selectedPath,
      );
      for (const [key, value] of Object.entries(state)) {
        currentState[key] = value;
      }
    }
  });
  return currentState;
}
export const builderSelectors = {
  getStepOutputFromExecutionPath,
};

export const useSwitchToDraft = () => {
  const [flowVersion, setVersion] = useBuilderStateContext((state) => [
    state.flowVersion,
    state.setVersion,
  ]);

  const { mutate: switchToDraft, isPending: isSwitchingToDraftPending } =
    useMutation({
      mutationFn: async () => {
        const flow = await flowsApi.get(flowVersion.flowId);
        return flow;
      },
      onSuccess: (flow) => {
        setVersion(flow.version);
      },
      onError: () => {
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  return {
    switchToDraft,
    isSwitchingToDraftPending,
  };
};
