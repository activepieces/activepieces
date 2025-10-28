import { useMutation, useQueryClient } from '@tanstack/react-query';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { flowsApi } from '@/features/flows/lib/flows-api';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { api } from '@/lib/api';
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

import { useBuilderStateContext } from '../builder-hooks';

import { testStepUtils } from './test-step-utils';

const stringifyNullOrUndefined = (data: undefined | null) => {
  if (data === undefined) {
    return 'undefined';
  }
  return 'null';
};

export const testStepHooks = {
  useUpdateSampleData: (
    stepName: string,
    onSuccess?: (step: FlowTrigger | FlowAction) => void,
  ) => {
    const queryClient = useQueryClient();
    const { setSampleData, flowVersionId, applyOperation, flowId, step } =
      useBuilderStateContext((state) => {
        return {
          sampleDataInput: state.sampleDataInput[stepName],
          setSampleData: state.setSampleData,
          flowVersionId: state.flowVersion.id,
          step: flowStructureUtil.getStep(stepName, state.flowVersion.trigger),
          flowId: state.flow.id,
          applyOperation: state.applyOperation,
        };
      });

    return useMutation({
      mutationFn: async ({
        response,
      }: {
        response: { output?: unknown; success: boolean };
      }) => {
        if (isNil(step)) {
          console.error(`Step ${stepName} not found`);
          toast(INTERNAL_ERROR_TOAST);
          return;
        }

        if (response.success) {
          //if the output is undefined it will fail to save sample data unless we stringify it
          const output = isNil(response.output)
            ? stringifyNullOrUndefined(response.output)
            : response.output;
          setSampleData(step.name, output);
          const updatedFlowVersion = await flowsApi.update(flowId, {
            type: FlowOperationType.SAVE_SAMPLE_DATA,
            request: {
              stepName,
              payload: output,
              type: SampleDataFileType.OUTPUT,
              dataType:
                typeof response.output === 'string'
                  ? SampleDataDataType.STRING
                  : SampleDataDataType.JSON,
            },
          });
          const modifiedStep = flowStructureUtil.getStep(
            stepName,
            updatedFlowVersion.version.trigger,
          );
          if (!isNil(modifiedStep)) {
            if (flowStructureUtil.isTrigger(modifiedStep?.type)) {
              applyOperation({
                type: FlowOperationType.UPDATE_TRIGGER,
                request: modifiedStep as FlowTrigger,
              });
            } else {
              applyOperation({
                type: FlowOperationType.UPDATE_ACTION,
                request: modifiedStep as FlowAction,
              });
            }
          }
          return modifiedStep;
        }
      },
      onSuccess: (step) => {
        sampleDataHooks.invalidateSampleData(flowVersionId, queryClient);
        if (step) {
          onSuccess?.(step);
        }
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
          await triggerEventsApi.list({ flowId, cursor: undefined, limit: 5 })
        ).data.map((triggerEvent) => triggerEvent.id);
        await triggerEventsApi.test({
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
            flowId,
            cursor: undefined,
            limit: 5,
          });
          const newIds = newData.data.map((triggerEvent) => triggerEvent.id);
          if (!deepEqual(ids, newIds)) {
            if (newData.data.length > 0) {
              await updateSampleData({
                response: { success: true, output: newData.data[0].payload },
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
          flowId,
          mockData,
        });
        await updateSampleData({
          response: { success: true, output: data.payload },
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
          flowId,
          flowVersionId,
          testStrategy: TriggerTestStrategy.TEST_FUNCTION,
        });
        if (data.length > 0) {
          await updateSampleData({
            response: { success: true, output: data[0].payload },
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
    onProgress,
    mutationKey,
  }: {
    currentStep: FlowAction;
    setErrorMessage: ((msg: string | undefined) => void) | undefined;
    setConsoleLogs: ((logs: string | null) => void) | undefined;
    onSuccess: (() => void) | undefined;
    onProgress?: (progress: StepRunResponse) => void;
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
        if (!isNil(params?.preExistingSampleData)) {
          return params.preExistingSampleData;
        }
        const response = await flowRunsApi.testStep(
          socket,
          {
            flowVersionId,
            stepName: currentStep.name,
          },
          (progress) => {
            if (params?.abortSignal?.aborted) {
              throw new Error(CANCEL_TEST_STEP_ERROR_MESSAGE);
            }
            onProgress?.(progress);
          },
        );
        if (params?.abortSignal?.aborted) {
          throw new Error(CANCEL_TEST_STEP_ERROR_MESSAGE);
        }
        return response;
      },
      onSuccess: (testStepResponse: StepRunResponse) => {
        const { success, standardOutput, standardError } = testStepResponse;
        const errorMessage = success ? standardOutput : standardError;
        setErrorMessage?.(undefined);
        setConsoleLogs?.(errorMessage ?? null);
        if (success) {
          updateSampleData({
            response: testStepResponse,
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
        toast(INTERNAL_ERROR_TOAST);
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
      preExistingSampleData?: StepRunResponse;
      abortSignal?: AbortSignal;
    }
  | undefined;

const CANCEL_TEST_STEP_ERROR_MESSAGE = 'Test step aborted';
