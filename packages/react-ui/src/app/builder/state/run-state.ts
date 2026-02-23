import { Socket } from 'socket.io-client';
import { StoreApi } from 'zustand';

import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunUtils } from '@/features/flow-runs/lib/flow-run-utils';
import {
  FlowAction,
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
import { defaultAgentOutput, isRunAgent } from '../test-step/agent-test-step';

export type UpdateSampleDataParams = {
  stepName: string;
  input?: unknown;
  output?: unknown;
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
  removeAllStepTestsListeners: () => void;
  isStepBeingTested: (stepName: string) => boolean;
  /**Used to revert the sample data locally when the test is cancelled */
  revertSampleDataLocallyCallbacks: Record<string, (() => void) | undefined>;
  beforeStepTestPreparation: (step: FlowAction) => void;
};
type RunStateInitialState = {
  run: FlowRun | null;
  flowVersion: FlowVersion;
  socket: Socket;
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
        get().removeAllStepTestsListeners();
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
      const step = flowStructureUtil.getStep(
        stepName,
        get().flowVersion.trigger,
      );
      if (isNil(step) || !flowStructureUtil.isAction(step?.type)) {
        console.error(`Step ${stepName} not found or is not an action`);
        return;
      }
      const socket = initialState.socket;
      get().beforeStepTestPreparation(step);
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
          if (!response.success) {
            get().setErrorLogs(
              stepName,
              response.standardError === '' ? null : response.standardError,
            );
          }
          if (step.type === FlowActionType.CODE) {
            get().setConsoleLogs(
              stepName,
              response.standardOutput === '' ? null : response.standardOutput,
            );
          }
        }
      };
      const handleError = (error: any) => {
        get().removeStepTestListener(stepName);
        get().revertSampleDataLocallyCallbacks[stepName]?.();
        console.error(error);
        internalErrorToast();
      };
      socket.on(WebsocketClientEvent.TEST_STEP_FINISHED, handleStepFinished);
      socket.on('error', handleError);
      const handleOnProgress = (response: StepRunResponse) => {
        if (response.runId === runId && response.output) {
          get().setSampleDataLocally({
            stepName: stepName,
            type: 'output',
            value: response.output,
          });
        }
      };
      socket.on(WebsocketClientEvent.TEST_STEP_PROGRESS, handleOnProgress);
      set((state) => ({
        stepTestListeners: {
          ...state.stepTestListeners,
          [stepName]: {
            onProgress: handleOnProgress,
            onFinish: handleStepFinished,
            error: handleError,
          },
        },
      }));
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
    updateSampleData: ({ stepName, input, output }: UpdateSampleDataParams) => {
      const { setSampleDataLocally, applyOperation, flowVersion } = get();
      const step = flowStructureUtil.getStep(stepName, flowVersion.trigger);
      if (isNil(step)) {
        console.error(`Step ${stepName} not found`);
        internalErrorToast();
        return;
      }
      setSampleDataLocally({
        stepName: step.name,
        type: 'output',
        value: output,
      });
      const payload = isNil(output) ? stringifyNullOrUndefined(output) : output;
      applyOperation({
        type: FlowOperationType.SAVE_SAMPLE_DATA,
        request: {
          stepName: step.name,
          payload,
          type: SampleDataFileType.OUTPUT,
        },
      });
      if (!isNil(input)) {
        setSampleDataLocally({
          stepName: step.name,
          type: 'input',
          value: input,
        });
        applyOperation({
          type: FlowOperationType.SAVE_SAMPLE_DATA,
          request: {
            stepName: step.name,
            payload: input,
            type: SampleDataFileType.INPUT,
          },
        });
      }
    },
    setErrorLogs: (stepName: string, error: string | null) => {
      set((state) => {
        return {
          errorLogs: {
            ...state.errorLogs,
            [stepName]: error,
          },
        };
      });
    },
    getErrorLogs: (stepName: string) => {
      return get().errorLogs[stepName] ?? null;
    },
    errorLogs: {},
    setConsoleLogs: (stepName: string, consoleLogs: string | null) => {
      set((state) => {
        return {
          consoleLogs: {
            ...state.consoleLogs,
            [stepName]: consoleLogs,
          },
        };
      });
    },
    getConsoleLogs: (stepName: string) => {
      return get().consoleLogs[stepName] ?? null;
    },
    consoleLogs: {},
    removeAllStepTestsListeners: () => {
      const stepTestListeners = get().stepTestListeners;
      Object.keys(stepTestListeners).forEach((stepName) => {
        get().removeStepTestListener(stepName);
      });
    },
    isStepBeingTested: (stepName: string) => {
      return !isNil(get().stepTestListeners[stepName]);
    },
    beforeStepTestPreparation: (step: FlowAction) => {
      const stepName = step.name;
      get().removeStepTestListener(stepName);
      const currentSampleData = get().outputSampleData[stepName];
      const currentErrorLogs = get().errorLogs[stepName];
      const currentConsoleLogs = get().consoleLogs[stepName];
      const currentSampleDataInput = get().inputSampleData[stepName];
      if (isRunAgent(step)) {
        get().setSampleDataLocally({
          stepName: stepName,
          type: 'output',
          value: defaultAgentOutput,
        });
      } else {
        get().setSampleDataLocally({
          stepName: stepName,
          type: 'output',
          value: null,
        });
      }
      get().setErrorLogs(stepName, null);
      get().setConsoleLogs(stepName, null);
      get().setSampleDataLocally({
        stepName: stepName,
        type: 'input',
        value: null,
      });
      const revertSampleDataLocallyCallback = () => {
        get().setSampleDataLocally({
          stepName: stepName,
          type: 'output',
          value: currentSampleData,
        });
        get().setSampleDataLocally({
          stepName: stepName,
          type: 'input',
          value: currentSampleDataInput,
        });
        get().setErrorLogs(stepName, currentErrorLogs);
        get().setConsoleLogs(stepName, currentConsoleLogs);
        set((state) => {
          return {
            revertSampleDataLocallyCallbacks: {
              ...state.revertSampleDataLocallyCallbacks,
              [stepName]: undefined,
            },
          };
        });
      };
      set((state) => {
        return {
          revertSampleDataLocallyCallbacks: {
            ...state.revertSampleDataLocallyCallbacks,
            [stepName]: revertSampleDataLocallyCallback,
          },
        };
      });
    },
  };
};
