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

export enum PublishButtonStatus {
  LOADING = 'loading',
  READY = 'ready',
}

export type BuilderState = {
  flow: Flow;
  flowVersion: FlowVersion;
  readonly: boolean;
  run: FlowRun | null;
  leftSidebar: LeftSideBarType;
  rightSidebar: RightSideBarType;
  selectedStep: StepPathWithName | null;
  publishButtonStatus: PublishButtonStatus;
  ExitRun: () => void;
  selectStep(path: StepPathWithName): void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setLeftSidebar: (leftSidebar: LeftSideBarType) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
  applyOperation: (
    operation: FlowOperationRequest,
    onError: () => void,
  ) => void;
  setReadOnly: (readonly: boolean) => void;
  setVersion: (flowVersion: FlowVersion) => void;
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
    publishButtonStatus: PublishButtonStatus.READY,
    selectedStep: null,
    rightSidebar: RightSideBarType.NONE,
    ExitRun: () =>
      set({
        run: null,
        readonly: false,
        leftSidebar: LeftSideBarType.NONE,
        rightSidebar: RightSideBarType.NONE,
      }),
    selectStep: (path: StepPathWithName) =>
      set({
        selectedStep: path,
        rightSidebar: RightSideBarType.PIECE_SETTINGS,
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
    applyOperation: (operation: FlowOperationRequest, onError: () => void) =>
      set((state) => {
        const newFlowVersion = flowHelper.apply(state.flowVersion, operation);
        const updateRequest = async () => {
          set({ publishButtonStatus: PublishButtonStatus.LOADING });
          try {
            await flowsApi.update(state.flow.id, operation);
            set({
              publishButtonStatus:
                flowUpdatesQueue.size() === 0
                  ? PublishButtonStatus.READY
                  : PublishButtonStatus.LOADING,
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
  }));

export const stepPathToKeyString = (path: StepPathWithName): string => {
  return path.path.map((p) => p.join('-')).join('/') + '/' + path.stepName;
};

export const equalStepPath = (
  path1: StepPathWithName,
  path2: StepPathWithName,
): boolean => {
  return (
    path1.path.length === path2.path.length &&
    path1.path.every(
      (p, idx) => p[0] === path2.path[idx][0] && p[1] === path2.path[idx][1],
    ) &&
    path1.stepName === path2.stepName
  );
};

export function getStepOutputFromExecutionPath({
  path,
  executionState,
}: {
  path: StepPathWithName;
  executionState: ExecutionState;
}): StepOutput | undefined {
  const stateAtPath = getStateAtPath({
    currentPath: path,
    steps: executionState.steps,
  });
  return stateAtPath[path.stepName];
}

function getStateAtPath({
  currentPath,
  steps,
}: {
  currentPath: StepPathWithName;
  steps: Record<string, StepOutput>;
}): Record<string, StepOutput> {
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
