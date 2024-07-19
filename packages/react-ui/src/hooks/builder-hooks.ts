import { createContext, useContext } from 'react';
import { create, useStore } from 'zustand';

import {
  ActionType,
  ExecutionState,
  Flow,
  FlowOperationRequest,
  FlowRun,
  FlowVersion,
  StepOutput,
} from '@activepieces/shared';

export const BuilderStateContext = createContext<BuilderStore | null>(null);

export function useBuilderStateContext<T>(
  selector: (state: BuilderState) => T,
): T {
  const store = useContext(BuilderStateContext);
  if (!store)
    throw new Error('Missing BuilderStateContext.Provider in the tree');
  return useStore(store, selector);
}

export type StepExecutionPath = {
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
  operations: FlowOperationRequest[];
  selectedStep: StepExecutionPath | null;
  ExitRun: () => void;
  selectStep(path: StepExecutionPath): void;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  setLeftSidebar: (leftSidebar: LeftSideBarType) => void;
  setRightSidebar: (rightSidebar: RightSideBarType) => void;
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
    operations: [],
    selectedStep: null,
    rightSidebar: RightSideBarType.NONE,
    ExitRun: () =>
      set({
        run: null,
        leftSidebar: LeftSideBarType.NONE,
        rightSidebar: RightSideBarType.NONE,
      }),
    selectStep: (path: StepExecutionPath) => set({ selectedStep: path }),
    setRightSidebar: (rightSidebar: RightSideBarType) => set({ rightSidebar }),
    setLeftSidebar: (leftSidebar: LeftSideBarType) => set({ leftSidebar }),
    setRun: async (run: FlowRun | null, flowVersion: FlowVersion) =>
      set({
        run,
        flowVersion,
        selectedStep: null,
      }),
    setReadOnly: (readonly: boolean) => set({ readonly }),
    setVersion: (flowVersion: FlowVersion) => set({ flowVersion, run: null }),
  }));

export function getStepOutputFromExecutionPath({
  path,
  executionState,
}: {
  path: StepExecutionPath;
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
  currentPath: StepExecutionPath;
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
