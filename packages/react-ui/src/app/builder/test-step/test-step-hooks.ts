import { useMutation } from '@tanstack/react-query';
import dayjs from 'dayjs';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { useFormContext, UseFormReturn } from 'react-hook-form';

import { sampleDataApi } from '@/features/flows/lib/sample-data-api';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { api } from '@/lib/api';
import {
  ApErrorParams,
  ErrorCode,
  FileType,
  FlowVersion,
  isNil,
  parseToJsonIfPossible,
  PopulatedFlow,
  Trigger,
  TriggerEventWithPayload,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { testStepUtils } from './test-step-utils';

const useRequiredStateToTestTriggers = () => {
  const form = useFormContext<Trigger>();
  const builderState = useBuilderStateContext((state) => ({
    flow: state.flow,
    flowVersion: state.flowVersion,
    setSampleData: state.setSampleData,
    setSampleDataInput: state.setSampleDataInput,
  }));
  return { form, builderState };
};
const testStepHooks = {
  useSimulateTrigger: ({
    setErrorMessage,
    onSuccess,
  }: {
    setErrorMessage: (msg: string | undefined) => void;
    onSuccess: () => void;
  }) => {
    const { form, builderState } = useRequiredStateToTestTriggers();
    const flowId = builderState.flow.id;
    return useMutation<TriggerEventWithPayload[], Error, void>({
      mutationFn: async () => {
        setErrorMessage(undefined);
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
          await waitFor2Seconds();
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
        setErrorMessage(
          testStepUtils.formatErrorMessage(
            t('There is no sample data available found for this trigger.'),
          ),
        );
      },
    });
  },
  useSaveMockData: ({
    mockData,
    onSuccess,
  }: {
    mockData: unknown;
    onSuccess: () => void;
  }) => {
    const { form, builderState } = useRequiredStateToTestTriggers();
    const flowId = builderState.flow.id;
    return useMutation({
      mutationFn: async () => {
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
    const { form, builderState } = useRequiredStateToTestTriggers();
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
    const { form, builderState } = useRequiredStateToTestTriggers();
    return useMutation({
      mutationFn: async (data: TriggerEventWithPayload) => {
        await updateTriggerSampleData({ data, form, builderState });
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

const waitFor2Seconds = () =>
  new Promise((resolve) => setTimeout(resolve, 2000));

export default testStepHooks;
