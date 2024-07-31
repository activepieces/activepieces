import { createContext, useContext } from 'react';
import { create, useStore } from 'zustand';

import { flowsApi } from '@/features/flows/lib/flows-api';
import { PromiseQueue } from '@/lib/promise-queue';
import {
  ActionType,
  ExecutionState,
  Flow,
  FlowOperationRequest,
  FlowRun,
  FlowVersion,
  StepOutput,
  flowHelper,
} from '@activepieces/shared';

import { MentionTreeNode, dataSelector } from '../../lib/data-selector-utils';

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
  NONE = 'none',
}

export enum RightSideBarType {
  NONE = 'none',
  PIECE_SELECTOR = 'piece-selector',
  PIECE_SETTINGS = 'piece-settings',
}

export type BuilderState = {
  flow: Flow;
  flowVersion: FlowVersion;
  readonly: boolean;
  run: FlowRun | null;
  leftSidebar: LeftSideBarType;
  rightSidebar: RightSideBarType;
  selectedStep: StepPathWithName | null;
  activeDraggingStep: string | null;
  allowCanvasPanning: boolean;
  saving: boolean;
  ExitRun: () => void;
  selectStep(path: StepPathWithName | null): void;
  ExitStepSettings: () => void;
  renameFlowClientSide: (newName: string) => void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setLeftSidebar: (leftSidebar: LeftSideBarType) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  applyOperation: (
    operation: FlowOperationRequest,
    onError: () => void,
  ) => void;
  startSaving: () => void;
  setAllowCanvasPanning: (allowCanvasPanning: boolean) => void;
  setReadOnly: (readonly: boolean) => void;
  setActiveDraggingStep: (stepName: string | null) => void;
  setFlow: (flow: Flow) => void;
  setVersion: (flowVersion: FlowVersion) => void;
  insertMention: (propertyPath: string) => void;
  setInsertMentionHandler: (handler: (propertyPath: string) => void) => void;
};

export type BuilderInitialState = Pick<
  BuilderState,
  'flow' | 'flowVersion' | 'readonly' | 'run'
>;

export type BuilderStore = ReturnType<typeof createBuilderStore>;

export const createBuilderStore = (initialState: BuilderInitialState) =>
  create<BuilderState>((set) => ({
    flow: initialState.flow,
    flowVersion: initialState.flowVersion,
    leftSidebar: LeftSideBarType.NONE,
    readonly: initialState.readonly,
    run: initialState.run,
    saving: false,
    selectedStep: null,
    activeDraggingStep: null,
    allowCanvasPanning: true,
    rightSidebar: RightSideBarType.NONE,
    setAllowCanvasPanning: (allowCanvasPanning: boolean) =>
      set({
        allowCanvasPanning,
      }),
    setActiveDraggingStep: (stepName: string | null) =>
      set({
        activeDraggingStep: stepName,
      }),
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
    setFlow: (flow: Flow) => set({ flow }),
    ExitRun: () =>
      set({
        run: null,
        readonly: false,
        leftSidebar: LeftSideBarType.NONE,
        rightSidebar: RightSideBarType.NONE,
      }),
    ExitStepSettings: () =>
      set({
        rightSidebar: RightSideBarType.NONE,
        selectedStep: null,
      }),
    selectStep: (path: StepPathWithName | null) =>
      set({
        selectedStep: path,
        rightSidebar: path
          ? RightSideBarType.PIECE_SETTINGS
          : RightSideBarType.NONE,
      }),
    setRightSidebar: (rightSidebar: RightSideBarType) => set({ rightSidebar }),
    setLeftSidebar: (leftSidebar: LeftSideBarType) => set({ leftSidebar }),
    setRun: async (run: FlowRun, flowVersion: FlowVersion) =>
      set({
        run,
        flowVersion,
        selectedStep: null,
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
    setReadOnly: (readonly: boolean) => set({ readonly }),
    setVersion: (flowVersion: FlowVersion) => set({ flowVersion, run: null }),
    insertMention: (propertyPath: string) => {
      console.warn('insertMention is not assigned yet', propertyPath);
    },
    setInsertMentionHandler: (
      insertMention: (propertyPath: string) => void,
    ) => {
      set({ insertMention });
    },
  }));

export const stepPathToKeyString = (path: StepPathWithName): string => {
  return path.path.map((p) => p.join('-')).join('/') + '/' + path.stepName;
};

function getStepOutputFromExecutionPath({
  path,
  executionState,
}: {
  path: StepPathWithName;
  executionState: ExecutionState;
}): StepOutput | undefined {
  const stateAtPath = getStateAtPath(path, executionState.steps);
  return stateAtPath[path.stepName];
}

function getStateAtPath(
  currentPath: StepPathWithName,
  steps: Record<string, StepOutput>
): Record<string, StepOutput> {
  let targetMap = steps;
  currentPath.path.forEach(([stepName, iteration]) => {
    const stepOutput = targetMap[stepName];
    if (!stepOutput.output || stepOutput.type !== ActionType.LOOP_ON_ITEMS) {
      throw new Error(
        '[ExecutionState#getTargetMap] Not instance of Loop On Items step output',
      );
    }
    targetMap = stepOutput.output.iterations[iteration];
  });
  return targetMap;
}

const getAllStepsMentions: (state: BuilderState) => MentionTreeNode[] = (
  state,
) => {
  const { selectedStep, flowVersion } = state;
  if (!selectedStep || !flowVersion || !flowVersion.trigger) {
    return [];
  }
  const step = flowHelper.getStep(flowVersion, selectedStep.stepName);
  if (!step) {
    return [];
  }
  const path = flowHelper.findPathToStep({
    stepToFind: step,
    trigger: flowVersion?.trigger,
  });

  return path.map((s) => {
    const stepMentionNode: MentionTreeNode =
      dataSelector.traverseStepOutputAndReturnMentionTree({
        stepOutput: s.settings.inputUiInfo?.currentSelectedData,
        propertyPath: s.name,
        displayName: s.displayName,
      });
    const stepNeedsTesting =
      s.settings.inputUiInfo?.currentSelectedData === undefined;
    return {
      ...stepMentionNode,
      data: {
        ...stepMentionNode.data,
        displayName: `${s.dfsIndex}. ${s.displayName}`,
      },
      children: stepNeedsTesting
        ? [
          {
            data: {
              displayName: 'Testing Step',
              propertyPath: s.name,
              isTestStepNode: true,
              isSlice: false,
            },
            key: s.name,
          },
        ]
        : stepMentionNode.children,
    };
  });
};

const getStep = (stepName: string) => {
  return (state: BuilderState) => {
    const { flowVersion } = state;
    if (!flowVersion) {
      return undefined;
    }
    return flowHelper.getStep(flowVersion, stepName);
  };
};

export const builderSelectors = {
  getAllStepsMentions,
  getStepOutputFromExecutionPath,
  getStep,
};
