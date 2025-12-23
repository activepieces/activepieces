import { useMutation, useQueryClient } from '@tanstack/react-query';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { wait } from '@/lib/utils';
import {
  FlowAction,
  ApErrorParams,
  ErrorCode,
  parseToJsonIfPossible,
  StepRunResponse,
  FlowTrigger,
  TriggerEventWithPayload,
  isNil,
  FlowOperationType,
  flowStructureUtil,
  SampleDataFileType,
  TriggerTestStrategy,
  SampleDataDataType,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

import { testStepUtils } from './test-step-utils';

const stringifyNullOrUndefined = (data: undefined | null) => {
  if (data === undefined) {
    return 'undefined';
  }
  return 'null';
};

export const testStepHooks = {
  useUpdateSampleData: (stepName: string) => {
    const queryClient = useQueryClient();
    const { flowVersionId, applyOperation, step, setSampleData } =
      useBuilderStateContext((state) => {
        return {
          flowVersionId: state.flowVersion.id,
          step: flowStructureUtil.getStep(stepName, state.flowVersion.trigger),
          applyOperation: state.applyOperation,
          setSampleData: state.setSampleData,
        };
      });

    return useMutation({
      mutationFn: async ({
        response,
      }: {
        response:
          | {
              testType: 'trigger' | 'mockData' | 'todo';
              output?: unknown;
              success: boolean;
            }
          | ({ testType: 'action'; success: boolean } & StepRunResponse);
      }) => {
        if (isNil(step)) {
          console.error(`Step ${stepName} not found`);
          internalErrorToast();
          return;
        }
        if (response.success) {
          //if the output is undefined it will fail to save sample data unless we stringify it
          const output = isNil(response.output)
            ? stringifyNullOrUndefined(response.output)
            : response.output;
          setSampleData({ stepName: step.name, type: 'output', value: output });
          applyOperation({
            type: FlowOperationType.SAVE_SAMPLE_DATA,
            request: {
              stepName: step.name,
              payload: output,
              type: SampleDataFileType.OUTPUT,
              dataType:
                typeof output === 'string'
                  ? SampleDataDataType.STRING
                  : SampleDataDataType.JSON,
            },
          });
          if (response.testType === 'action') {
            const input = isNil(response.input)
              ? stringifyNullOrUndefined(response.input)
              : response.input;
            setSampleData({ stepName: step.name, type: 'input', value: input });
            applyOperation({
              type: FlowOperationType.SAVE_SAMPLE_DATA,
              request: {
                stepName: step.name,
                payload: input,
                type: SampleDataFileType.INPUT,
                dataType:
                  typeof input === 'string'
                    ? SampleDataDataType.STRING
                    : SampleDataDataType.JSON,
              },
            });
          }
        }
      },
      onSuccess: () => {
        //we do this so next time the user enters the builder, the sample data is refetched
        sampleDataHooks.invalidateSampleData(flowVersionId, queryClient);
      },
    });
  },
  useSimulateTrigger: ({
    setErrorMessage,
    onSuccess,
  }: {
    setErrorMessage: ((msg: string | undefined) => void) | undefined;
    onSuccess: () => void;
  }) => {
    const { form, builderState } = useRequiredStateToTestSteps();
    const flowId = builderState.flow.id;
    const flowVersionId = builderState.flowVersionId;
    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      form.getValues().name,
    );

    return useMutation<TriggerEventWithPayload[], Error, AbortSignal>({
      mutationFn: async (abortSignal: AbortSignal) => {
        setErrorMessage?.(undefined);
        const ids = (
          await triggerEventsApi.list({
            projectId: authenticationSession.getProjectId()!,
            flowId,
            cursor: undefined,
            limit: 5,
          })
        ).data.map((triggerEvent) => triggerEvent.id);
        await triggerEventsApi.test({
          projectId: authenticationSession.getProjectId()!,
          flowId,
          flowVersionId,
          testStrategy: TriggerTestStrategy.SIMULATION,
        });
        let attempt = 0;
        while (attempt < 1000) {
          if (abortSignal.aborted) {
            return [];
          }
          const newData = await triggerEventsApi.list({
            projectId: authenticationSession.getProjectId()!,
            flowId,
            cursor: undefined,
            limit: 5,
          });
          const newIds = newData.data.map((triggerEvent) => triggerEvent.id);
          if (!deepEqual(ids, newIds)) {
            if (newData.data.length > 0) {
              await updateSampleData({
                response: {
                  testType: 'trigger',
                  success: true,
                  output: newData.data[0].payload,
                },
              });
            }
            return newData.data;
          }
          await wait(2000);
          attempt++;
        }
        return [];
      },
      onSuccess: async (results) => {
        if (results.length > 0) {
          onSuccess();
        }
      },
      onError: async (error) => {
        console.error(error);
        setErrorMessage?.(
          testStepUtils.formatErrorMessage(
            t('There is no sample data available found for this trigger.'),
          ),
        );
      },
    });
  },
  useSaveMockData: ({ onSuccess }: { onSuccess: () => void }) => {
    const { form, builderState } = useRequiredStateToTestSteps();
    const flowId = builderState.flow.id;
    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      form.getValues().name,
    );

    return useMutation({
      mutationFn: async (mockData: unknown) => {
        const data = await triggerEventsApi.saveTriggerMockdata({
          projectId: authenticationSession.getProjectId()!,
          flowId,
          mockData,
        });
        await updateSampleData({
          response: {
            testType: 'mockData',
            success: true,
            output: data.payload,
          },
        });
        return data;
      },
      onSuccess,
    });
  },
  usePollTrigger: ({
    setErrorMessage,
    onSuccess,
  }: {
    setErrorMessage: (msg: string | undefined) => void;
    onSuccess: () => void;
  }) => {
    const { form, builderState } = useRequiredStateToTestSteps();
    const flowId = builderState.flow.id;
    const flowVersionId = builderState.flowVersionId;
    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      form.getValues().name,
    );

    return useMutation<TriggerEventWithPayload[], Error, void>({
      mutationFn: async () => {
        setErrorMessage(undefined);
        const { data } = await triggerEventsApi.test({
          projectId: authenticationSession.getProjectId()!,
          flowId,
          flowVersionId,
          testStrategy: TriggerTestStrategy.TEST_FUNCTION,
        });
        if (data.length > 0) {
          await updateSampleData({
            response: {
              testType: 'trigger',
              success: true,
              output: data[0].payload,
            },
          });
        }
        return data;
      },
      onSuccess: async (data) => {
        if (data.length > 0) {
          onSuccess();
        }
      },
      onError: (error) => {
        if (api.isError(error)) {
          const apError = error.response?.data as ApErrorParams;
          let message =
            'Failed to run test step, please ensure settings are correct.';
          if (apError.code === ErrorCode.TEST_TRIGGER_FAILED) {
            message = JSON.stringify(
              {
                message:
                  'Failed to run test step, please ensure settings are correct.',
                error: parseToJsonIfPossible(apError.params.message),
              },
              null,
              2,
            );
          }
          setErrorMessage(message);
        } else {
          setErrorMessage(
            testStepUtils.formatErrorMessage(
              t('Internal error, please try again later.'),
            ),
          );
        }
      },
    });
  },
  /**To reset the loading state of the mutation use a new mutation key, but to make sure sucess never gets called, use the abortSignal */
  useTestAction: ({
    currentStep,
    setErrorMessage,
    setConsoleLogs,
    onSuccess,
    mutationKey,
  }: {
    currentStep: FlowAction;
    setErrorMessage: ((msg: string | undefined) => void) | undefined;
    setConsoleLogs: ((logs: string | null) => void) | undefined;
    onSuccess: (() => void) | undefined;
    mutationKey?: string[];
  }) => {
    const socket = useSocket();
    const { flowVersionId } = useRequiredStateToTestSteps().builderState;
    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      currentStep.name,
    );

    return useMutation<StepRunResponse, Error, TestActionMutationParams>({
      mutationKey,
      mutationFn: async (params: TestActionMutationParams) => {
        if (
          params?.type === 'webhookAction' &&
          !isNil(params?.preExistingSampleData)
        ) {
          return params.preExistingSampleData;
        }
        const response = await flowRunsApi.testStep({
          socket,
          request: {
            projectId: authenticationSession.getProjectId()!,
            flowVersionId,
            stepName: currentStep.name,
          },
          onProgress: params?.onProgress,
          onFinsih:
            params?.type === 'agentAction' ? params.onFinish : undefined,
        });
        return response;
      },
      onSuccess: (testStepResponse: StepRunResponse) => {
        const { success, standardOutput, standardError } = testStepResponse;
        const errorMessage = success ? standardOutput : standardError;
        setErrorMessage?.(undefined);
        setConsoleLogs?.(errorMessage ?? null);
        if (success) {
          updateSampleData({
            response: { testType: 'action', ...testStepResponse },
          });
          onSuccess?.();
        } else {
          setErrorMessage?.(
            testStepUtils.formatErrorMessage(
              errorMessage ??
                t(
                  'Failed to run test step, please ensure settings are correct.',
                ),
            ),
          );
        }
      },
      onError: (error) => {
        if (error.message === CANCEL_TEST_STEP_ERROR_MESSAGE) {
          return;
        }
        internalErrorToast();
      },
    });
  },
};

const useRequiredStateToTestSteps = () => {
  const form = useFormContext<FlowTrigger>();
  const builderState = useBuilderStateContext((state) => ({
    flow: state.flow,
    flowVersion: state.flowVersion,
    flowVersionId: state.flowVersion.id,
  }));
  return { form, builderState };
};

type TestActionMutationParams =
  | {
      preExistingSampleData: StepRunResponse;
      type: 'webhookAction';
      onProgress: undefined;
    }
  | {
      type: 'todoAction' | 'agentAction';
      onProgress: (progress: StepRunResponse) => void;
      onFinish?: () => void;
    }
  | undefined;

const CANCEL_TEST_STEP_ERROR_MESSAGE = 'Test step aborted';
