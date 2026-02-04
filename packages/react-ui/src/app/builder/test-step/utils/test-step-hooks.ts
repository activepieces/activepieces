import { useMutation } from '@tanstack/react-query';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';

import { internalErrorToast } from '@/components/ui/sonner';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
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
  TriggerTestStrategy,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';

import { testStepUtils } from './test-step-utils';

export const testStepHooks = {
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
    const stepName = form.getValues().name;

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
              builderState.updateSampleData({
                stepName,
                output: newData.data[0].payload,
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
    const stepName = form.getValues().name;

    return useMutation({
      mutationFn: async (mockData: unknown) => {
        const data = await triggerEventsApi.saveTriggerMockdata({
          projectId: authenticationSession.getProjectId()!,
          flowId,
          mockData,
        });
        builderState.updateSampleData({
          stepName,
          output: data.payload,
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
    const stepName = form.getValues().name;

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
          builderState.updateSampleData({
            stepName,
            output: data[0].payload,
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
  useTestAction: ({ currentStep }: { currentStep: FlowAction }) => {
    const { flowVersionId, addActionTestListener } =
      useRequiredStateToTestSteps().builderState;
    return useMutation<{ runId: string }, Error, TestActionMutationParams>({
      mutationFn: async () => {
        const response = await flowRunsApi.testStep({
          request: {
            projectId: authenticationSession.getProjectId()!,
            flowVersionId,
            stepName: currentStep.name,
          },
        });
        return response;
      },
      onSuccess: (testStepResponse: { runId: string }) => {
        addActionTestListener({
          runId: testStepResponse.runId,
          stepName: currentStep.name,
        });
      },
      onError: () => {
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
    addActionTestListener: state.addActionTestListener,
    updateSampleData: state.updateSampleData,
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
      type: 'agentAction';
      onProgress: (progress: StepRunResponse) => void;
      onFinish?: () => void;
    }
  | undefined;
