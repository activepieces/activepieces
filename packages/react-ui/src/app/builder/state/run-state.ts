import { StoreApi } from 'zustand';

import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import {
  FlowActionType,
  FlowRun,
  flowStructureUtil,
  FlowVersion,
  isNil,
  LoopStepOutput,
} from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';

export type RunState = {
  run: FlowRun | null;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  clearRun: (userHasPermissionToEditFlow: boolean) => void;
  loopsIndexes: Record<string, number>;
  setLoopIndex: (stepName: string, index: number) => void;
};
type RunStateInitialState = {
  run: FlowRun | null;
  flowVersion: FlowVersion;
};

export const createRunState = (
  initialState: RunStateInitialState,
  _: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): RunState => {
  return {
    run: initialState.run,
    loopsIndexes:
      initialState.run && initialState.run.steps
        ? flowRunUtils.findLoopsState(initialState.run, {})
        : {},
    setRun: async (run: FlowRun, flowVersion: FlowVersion) =>
      set((state) => {
        const loopsIndexes = flowRunUtils.findLoopsState(
          run,
          state.loopsIndexes,
        );
        return {
          loopsIndexes,
          run,
          flowVersion,
          readonly: true,
        };
      }),
    clearRun: (userHasPermissionToEditFlow: boolean) =>
      set({
        run: null,
        readonly: !userHasPermissionToEditFlow,
        loopsIndexes: {},
        selectedBranchIndex: null,
      }),

    setLoopIndex: (stepName: string, index: number) => {
      set((state) => {
        const parentLoop = flowStructureUtil.getStepOrThrow(
          stepName,
          state.flowVersion.trigger,
        );
        if (parentLoop.type !== FlowActionType.LOOP_ON_ITEMS) {
          console.error(
            `Trying to set loop index for a step that is not a loop: ${stepName}`,
          );
          return state;
        }
        const childLoops = flowStructureUtil
          .getAllChildSteps(parentLoop)
          .filter((c) => c.type === FlowActionType.LOOP_ON_ITEMS)
          .filter((c) => c.name !== stepName);
        const loopsIndexes = { ...state.loopsIndexes };

        loopsIndexes[stepName] = index;

        childLoops.forEach((childLoop) => {
          const childLoopOutput = flowRunUtils.extractStepOutput(
            childLoop.name,
            loopsIndexes,
            state.run?.steps ?? {},
          ) as LoopStepOutput | undefined;

          if (isNil(childLoopOutput) || isNil(childLoopOutput.output)) {
            loopsIndexes[childLoop.name] = 0;
          } else {
            loopsIndexes[childLoop.name] = Math.max(
              Math.min(
                loopsIndexes[childLoop.name],
                childLoopOutput.output.iterations.length - 1,
              ),
              0,
            );
          }
        });
        return {
          loopsIndexes,
        };
      });
    },
  };
};
