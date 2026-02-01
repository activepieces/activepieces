import { QueryClient } from '@tanstack/react-query';
import { Socket } from 'socket.io-client';
import { StoreApi } from 'zustand';

import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';
import {
  FlowActionType,
  FlowOperationType,
  FlowRun,
  flowStructureUtil,
  FlowVersion,
  isNil,
  LoopStepOutput,
  SampleDataFileType,
  StepRunResponse,
  stringifyNullOrUndefined,
  WebsocketClientEvent,
} from '@activepieces/shared';

import { BuilderState } from '../builder-hooks';

export type UpdateSampleDataParams = {
  stepName: string;
  input?: unknown;
  output?: unknown;
  onlyLocally?: boolean;
};

export type RunState = {
  run: FlowRun | null;
  setRun: (run: FlowRun, flowVersion: FlowVersion) => void;
  clearRun: (userHasPermissionToEditFlow: boolean) => void;
  loopsIndexes: Record<string, number>;
  setLoopIndex: (stepName: string, index: number) => void;
  addActionTestListener: ({
    runId,
    stepName,
  }: {
    runId: string;
    stepName: string;
  }) => void;
  removeStepTestListener: (stepName: string) => void;
  stepTestListeners: Record<string, StepTestListener | null | undefined>;
  updateSampleData: (params: UpdateSampleDataParams) => void;
  errorLogs: Record<string, string | null>;
  setErrorLogs: (stepName: string, error: string | null) => void;
  getErrorLogs: (stepName: string) => string | null;
  setConsoleLogs: (stepName: string, consoleLogs: string | null) => void;
  getConsoleLogs: (stepName: string) => string | null;
  consoleLogs: Record<string, string | null>;
  OnRunStateDestroyed: () => void;
  isStepBeingTested: (stepName: string) => boolean;
  revertSampleDataLocallyCallbacks: Record<string, (() => void) | undefined>;
};
type RunStateInitialState = {
  run: FlowRun | null;
  flowVersion: FlowVersion;
  socket: Socket;
  queryClient: QueryClient;
};
type StepTestListener = {
  onProgress: (response: StepRunResponse) => void;
  onFinish: (response: StepRunResponse) => void;
  error: (error: any) => void;
};
export const createRunState = (
  initialState: RunStateInitialState,
  get: StoreApi<BuilderState>['getState'],
  set: StoreApi<BuilderState>['setState'],
): RunState => {
  return {
    revertSampleDataLocallyCallbacks: {},
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
    addActionTestListener: ({
      runId,
      stepName,
    }: {
      runId: string;
      stepName: string;
    }) => {
      const socket = initialState.socket;
      const handleStepFinished = (response: StepRunResponse) => {
        if (response.runId === runId) {
          get().removeStepTestListener(stepName);
          if (response.success) {
            get().updateSampleData({
              stepName: stepName,
              output: response.output,
              input: response.input,
            });
          }
          get().setErrorLogs(
            stepName,
            response.standardError === '' ? null : response.standardError,
          );
          get().setConsoleLogs(
            stepName,
            response.standardOutput === '' ? null : response.standardOutput,
          );
        }
      };
      const handleError = (error: any) => {
        get().removeStepTestListener(stepName);
        console.error(error);
        internalErrorToast();
      };

      socket.on(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
      socket.on('error', handleError);
      const handleOnProgress = (response: StepRunResponse) => {
        if (response.runId === runId && response.output) {
          get().updateSampleData({
            stepName: stepName,
            output: response.output,
            onlyLocally: true,
          });
        }
      };
      socket.on(WebsocketClientEvent.TEST_STEP_PROGRESS, handleOnProgress);
      set((state) => {
        state.stepTestListeners[stepName] = {
          onProgress: handleOnProgress,
          onFinish: handleStepFinished,
          error: handleError,
        };
        return state;
      });
    },
    removeStepTestListener: (stepName: string) => {
      set((state) => {
        const socket = initialState.socket;
        const listeners = state.stepTestListeners[stepName];
        if (listeners) {
          socket.off(
            WebsocketClientEvent.TEST_STEP_FINISHED,
            listeners.onFinish,
          );
          socket.off(
            WebsocketClientEvent.TEST_STEP_PROGRESS,
            listeners.onProgress,
          );
          socket.off('error', listeners.error);
        }
        const stepTestListeners = { ...state.stepTestListeners };
        stepTestListeners[stepName] = null;
        return {
          stepTestListeners,
        };
      });
    },
    stepTestListeners: {},
    updateSampleData: ({
      stepName,
      input,
      output,
      onlyLocally,
    }: UpdateSampleDataParams) => {
      const { setSampleData, applyOperation, flowVersion } = get();
      const step = flowStructureUtil.getStep(stepName, flowVersion.trigger);

      if (isNil(step)) {
        console.error(`Step ${stepName} not found`);
        internalErrorToast();
        return;
      }
      const currentSampleData = get().outputSampleData[step.name];
      if (onlyLocally) {
        get().revertSampleDataLocallyCallbacks[step.name] = () => {
          setSampleData({
            stepName: step.name,
            type: 'output',
            value: currentSampleData,
          });
          get().revertSampleDataLocallyCallbacks[step.name] = undefined;
        };
      }
      setSampleData({ stepName: step.name, type: 'output', value: output });
      if (!onlyLocally) {
        const payload = isNil(output)
          ? stringifyNullOrUndefined(output)
          : output;
        applyOperation({
          type: FlowOperationType.SAVE_SAMPLE_DATA,
          request: {
            stepName: step.name,
            payload,
            type: SampleDataFileType.OUTPUT,
          },
        });
      }

      if (!isNil(input)) {
        setSampleData({ stepName: step.name, type: 'input', value: input });
        if (!onlyLocally) {
          applyOperation({
            type: FlowOperationType.SAVE_SAMPLE_DATA,
            request: {
              stepName: step.name,
              payload: input,
              type: SampleDataFileType.INPUT,
            },
          });
        }
      }

      // Invalidate so next time the user enters the builder, the sample data is refetched
      if (!onlyLocally) {
        sampleDataHooks.invalidateSampleData(
          flowVersion.id,
          initialState.queryClient,
        );
      }
    },
    setErrorLogs: (stepName: string, error: string | null) => {
      set((state) => {
        state.errorLogs[stepName] = error;
        return state;
      });
    },
    getErrorLogs: (stepName: string) => {
      return get().errorLogs[stepName] ?? null;
    },
    errorLogs: {},
    setConsoleLogs: (stepName: string, consoleLogs: string | null) => {
      set((state) => {
        state.consoleLogs[stepName] = consoleLogs;
        return state;
      });
    },
    getConsoleLogs: (stepName: string) => {
      return get().consoleLogs[stepName] ?? null;
    },
    consoleLogs: {},
    OnRunStateDestroyed: () => {
      const stepTestListeners = get().stepTestListeners;
      Object.keys(stepTestListeners).forEach((stepName) => {
        get().removeStepTestListener(stepName);
      });
    },
    isStepBeingTested: (stepName: string) => {
      return !isNil(get().stepTestListeners[stepName]);
    },
  };
};
