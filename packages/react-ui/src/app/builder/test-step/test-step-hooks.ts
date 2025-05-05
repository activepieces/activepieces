import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { useFormContext, UseFormReturn } from 'react-hook-form';

import { useSocket } from '@/components/socket-provider';
import { INTERNAL_ERROR_TOAST, toast } from '@/components/ui/use-toast';
import { flowRunsApi } from '@/features/flow-runs/lib/flow-runs-api';
import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { api } from '@/lib/api';
import {
  Action,
  ApErrorParams,
  ErrorCode,
  FileType,
  FlowOperationType,
  FlowVersion,
  isNil,
  parseToJsonIfPossible,
  PopulatedFlow,
  StepRunResponse,
  Trigger,
  TriggerEventWithPayload,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { testStepUtils } from './test-step-utils';

const useRequiredStateToTestSteps = () => {
  const form = useFormContext<Trigger>();
  const builderState = useBuilderStateContext((state) => ({
    flow: state.flow,
    flowVersion: state.flowVersion,
    setSampleData: state.setSampleData,
    setSampleDataInput: state.setSampleDataInput,
    applyOperation: state.applyOperation,
    flowVersionId: state.flowVersion.id,
    projectId: state.flow.projectId,
  }));
  return { form, builderState };
};
const testStepHooks = {
  useSimulateTrigger: ({
    setErrorMessage,
    onSuccess,
  }: {
    setErrorMessage: ((msg: string | undefined) => void) | undefined;
    onSuccess: () => void;
  }) => {
    const { form, builderState } = useRequiredStateToTestSteps();
    const flowId = builderState.flow.id;
    return useMutation<TriggerEventWithPayload[], Error, void>({
      mutationFn: async () => {
        setErrorMessage?.(undefined);
        const ids = (
          await triggerEventsApi.list({ flowId, cursor: undefined, limit: 5 })
        ).data.map((triggerEvent) => triggerEvent.id);
        await triggerEventsApi.startWebhookSimulation(flowId);
        // TODO REFACTOR: replace this with a websocket
        let attempt = 0;
        while (attempt < 1000) {
          const newData = await triggerEventsApi.list({
            flowId,
            cursor: undefined,
            limit: 5,
          });
          const newIds = newData.data.map((triggerEvent) => triggerEvent.id);
          if (!deepEqual(ids, newIds)) {
            if (newData.data.length > 0) {
              await updateTriggerSampleData({
                data: newData.data[0],
                form,
                builderState,
              });
            }
            return newData.data;
          }
          await waitFor1Second();
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
    return useMutation({
      mutationFn: async (mockData: unknown) => {
        const data = await triggerEventsApi.saveTriggerMockdata(
          flowId,
          mockData,
        );
        await updateTriggerSampleData({ data, form, builderState });
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
    return useMutation<TriggerEventWithPayload[], Error, void>({
      mutationFn: async () => {
        setErrorMessage(undefined);
        const { data } = await triggerEventsApi.pollTrigger({
          flowId,
        });
        if (data.length > 0) {
          await updateTriggerSampleData({
            builderState,
            data: data[0],
            form,
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
  useUpdateTriggerSampleData: () => {
    const { form, builderState } = useRequiredStateToTestSteps();
    return useMutation({
      mutationFn: async (data: TriggerEventWithPayload) => {
        await updateTriggerSampleData({ data, form, builderState });
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
    const {
      flowVersionId,
      projectId,
      setSampleData,
      setSampleDataInput,
      applyOperation,
    } = useRequiredStateToTestSteps().builderState;
    return useMutation<StepRunResponse, Error, StepRunResponse | undefined>({
      mutationFn: async (preExistingSampleData?: StepRunResponse) => {
        const testStepResponse =
          preExistingSampleData ??
          (await flowRunsApi.testStep(socket, {
            flowVersionId,
            stepName: currentStep.name,
          }));
        let sampleDataFileId: string | undefined = undefined;
        if (testStepResponse.success && !isNil(testStepResponse.output)) {
          const sampleFile = await sampleDataApi.save({
            flowVersionId,
            stepName: currentStep.name,
            payload: testStepResponse.output,
            projectId,
            fileType: FileType.SAMPLE_DATA,
          });
          sampleDataFileId = sampleFile.id;
        }
        const sampleDataInputFile = await sampleDataApi.save({
          flowVersionId,
          stepName: currentStep.name,
          payload: currentStep.settings,
          projectId,
          fileType: FileType.SAMPLE_DATA_INPUT,
        });
        return {
          ...testStepResponse,
          sampleDataFileId,
          sampleDataInputFileId: sampleDataInputFile.id,
        };
      },
      onSuccess: ({
        success,
        input,
        output,
        sampleDataFileId,
        sampleDataInputFileId,
        standardOutput,
        standardError,
      }) => {
        if (success) {
          setErrorMessage?.(undefined);
          const newInputUiInfo: Action['settings']['inputUiInfo'] = {
            ...currentStep.settings.inputUiInfo,
            sampleDataFileId,
            sampleDataInputFileId,
            currentSelectedData: undefined,
            lastTestDate: dayjs().toISOString(),
          };
          const currentStepCopy: Action = JSON.parse(
            JSON.stringify(currentStep),
          );
          currentStepCopy.settings.inputUiInfo = newInputUiInfo;
          applyOperation({
            type: FlowOperationType.UPDATE_ACTION,
            request: currentStepCopy,
          });
        } else {
          setErrorMessage?.(
            testStepUtils.formatErrorMessage(
              JSON.stringify(output) ||
                t('Failed to run test step and no error message was returned'),
            ),
          );
        }
        setSampleData(currentStep.name, output);
        setSampleDataInput(currentStep.name, input);
        setConsoleLogs?.(standardOutput || standardError);
        onSuccess?.();
      },
      onError: (error) => {
        console.error(error);
        toast(INTERNAL_ERROR_TOAST);
      },
    });
  },
};

async function updateTriggerSampleData({
  data,
  form,
  builderState,
}: {
  data: TriggerEventWithPayload;
  form: UseFormReturn<Trigger>;
  builderState: {
    flow: PopulatedFlow;
    flowVersion: FlowVersion;
    setSampleData: (stepName: string, payload: unknown) => void;
    setSampleDataInput: (stepName: string, payload: unknown) => void;
  };
}) {
  let sampleDataFileId: string | undefined = undefined;
  const formValues = form.getValues();
  const { flow, flowVersion, setSampleData, setSampleDataInput } = builderState;
  const sampleDataInputFile = await sampleDataApi.save({
    flowVersionId: flowVersion.id,
    stepName: formValues.name,
    payload: formValues.settings?.input ?? {},
    projectId: flow.projectId,
    fileType: FileType.SAMPLE_DATA_INPUT,
  });

  if (!isNil(data.payload)) {
    const sampleDataFile = await sampleDataApi.save({
      flowVersionId: flowVersion.id,
      stepName: formValues.name,
      payload: data.payload,
      projectId: flow.projectId,
      fileType: FileType.SAMPLE_DATA,
    });
    sampleDataFileId = sampleDataFile.id;
  }

  form.setValue(
    'settings.inputUiInfo',
    {
      ...formValues.settings.inputUiInfo,
      sampleDataFileId,
      sampleDataInputFileId: sampleDataInputFile.id,
      currentSelectedData: undefined,
      lastTestDate: dayjs().toISOString(),
    },
    { shouldValidate: true },
  );
  setSampleData(formValues.name, data.payload);
  setSampleDataInput(formValues.name, formValues.settings?.input ?? {});
}

const waitFor1Second = () =>
  new Promise((resolve) => setTimeout(resolve, 10000));

export default testStepHooks;
