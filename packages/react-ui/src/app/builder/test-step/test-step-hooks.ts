import { useMutation, useQueryClient } from '@tanstack/react-query';
import dayjs from 'dayjs';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { useFormContext } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { sampleDataHooks } from '@/features/flows/lib/sample-data-hooks';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { api } from '@/lib/api';
import { authenticationSession } from '@/lib/authentication-session';
import { wait } from '@/lib/utils';
import {
  Action,
  ApErrorParams,
  ErrorCode,
  parseToJsonIfPossible,
  StepRunResponse,
  Trigger,
  TriggerEventWithPayload,
  FileType,
  isNil,
  FlowOperationType,
  TriggerType,
  flowStructureUtil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { testStepUtils } from './test-step-utils';

export const testStepHooks = {
  useUpdateSampleData: (
    stepName: string,
    onSuccess?: (step: Trigger | Action) => void,
  ) => {
    const projectId = authenticationSession.getProjectId()!;
    const queryClient = useQueryClient();
    const {
      setSampleData,
      setSampleDataInput,
      applyOperation,
      flowVersionId,
      step,
    } = useBuilderStateContext((state) => {
      return {
        sampleDataInput: state.sampleDataInput[stepName],
        setSampleData: state.setSampleData,
        setSampleDataInput: state.setSampleDataInput,
        applyOperation: state.applyOperation,
        flowVersionId: state.flowVersion.id,
        step: flowStructureUtil.getStep(stepName, state.flowVersion.trigger),
      };
    });

    return useMutation({
      mutationFn: async ({
        response,
      }: {
        response: { output?: unknown; success: boolean };
      }) => {
        let sampleDataFileId: string | undefined = undefined;
        if (isNil(step)) {
          console.error(`Step ${stepName} not found`);
          toast(INTERNAL_ERROR_TOAST);
          return;
        }
        if (response.success && !isNil(response.output)) {
          const sampleFile = await sampleDataApi.save({
            flowVersionId,
            stepName: step.name,
            payload: response.output,
            projectId,
            fileType: FileType.SAMPLE_DATA,
          });
          sampleDataFileId = sampleFile.id;
        }

        const sampleDataInputFile = await sampleDataApi.save({
          flowVersionId,
          stepName: step.name,
          payload: step.settings,
          projectId,
          fileType: FileType.SAMPLE_DATA_INPUT,
        });

        const stepCopy: Action | Trigger = JSON.parse(JSON.stringify(step));
        stepCopy.settings.inputUiInfo = {
          ...step.settings.inputUiInfo,
          sampleDataFileId,
          sampleDataInputFileId: sampleDataInputFile.id,
          currentSelectedData: undefined,
          lastTestDate: dayjs().toISOString(),
        };

        const type =
          step.type === TriggerType.PIECE
            ? FlowOperationType.UPDATE_TRIGGER
            : FlowOperationType.UPDATE_ACTION;
        if (type === FlowOperationType.UPDATE_TRIGGER) {
          applyOperation({
            type: FlowOperationType.UPDATE_TRIGGER,
            request: stepCopy as Trigger,
          });
        } else {
          applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: stepCopy as Action,
          });
        }

        setSampleData(step.name, response.output);
        setSampleDataInput(step.name, step.settings);

        return stepCopy;
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
    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      form.getValues().name,
    );

    return useMutation<TriggerEventWithPayload[], Error, AbortSignal>({
      mutationFn: async (abortSignal: AbortSignal) => {
        setErrorMessage?.(undefined);
        const ids = (
          await triggerEventsApi.list({ flowId, cursor: undefined, limit: 5 })
        ).data.map((triggerEvent) => triggerEvent.id);
        const webhookSimulation = await triggerEventsApi.getWebhookSimulation(
          flowId,
        );
        if (!webhookSimulation) {
          await triggerEventsApi.startWebhookSimulation(flowId);
        }
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
          await triggerEventsApi.deleteWebhookSimulation(flowId);
        }
      },
      onError: async (error) => {
        console.error(error);
        await triggerEventsApi.deleteWebhookSimulation(flowId);
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
        const data = await triggerEventsApi.saveTriggerMockdata(
          flowId,
          mockData,
        );
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
    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      form.getValues().name,
    );

    return useMutation<TriggerEventWithPayload[], Error, void>({
      mutationFn: async () => {
        setErrorMessage(undefined);
        const { data } = await triggerEventsApi.pollTrigger({ flowId });
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
  useTestAction: ({
    currentStep,
    setErrorMessage,
    setConsoleLogs,
    onSuccess,
  }: {
    currentStep: Action;
    setErrorMessage: ((msg: string | undefined) => void) | undefined;
    setConsoleLogs: ((logs: string | null) => void) | undefined;
    onSuccess: (() => void) | undefined;
  }) => {
    const socket = useSocket();
    const { flowVersionId } = useRequiredStateToTestSteps().builderState;
    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      currentStep.name,
    );

    return useMutation<StepRunResponse, Error, StepRunResponse | undefined>({
      mutationFn: async (preExistingSampleData?: StepRunResponse) => {
        const testStepResponse =
          preExistingSampleData ??
          (await flowRunsApi.testStep(socket, {
            flowVersionId,
            stepName: currentStep.name,
          }));

        await updateSampleData({
          response: testStepResponse,
        });

        return testStepResponse;
      },
      onSuccess: ({ success, standardOutput, standardError }) => {
        setErrorMessage?.(undefined);
        setConsoleLogs?.(standardOutput ?? standardError ?? null);
        if (success) {
          onSuccess?.();
        } else {
          setErrorMessage?.(
            testStepUtils.formatErrorMessage(
              t('Failed to run test step, please ensure settings are correct.'),
            ),
          );
        }
      },
      onError: (error) => {
        console.error(error);
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  },
};

const useRequiredStateToTestSteps = () => {
  const form = useFormContext<Trigger>();
  const builderState = useBuilderStateContext((state) => ({
    flow: state.flow,
    flowVersion: state.flowVersion,
    flowVersionId: state.flowVersion.id,
  }));
  return { form, builderState };
};
