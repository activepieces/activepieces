import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import React, { useMemo, useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  SeekPage,
  Trigger,
  TriggerEventWithPayload,
  TriggerTestStrategy,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../../builder-hooks';
import { McpToolTestingDialog } from '../custom-test-step/mcp-tool-testing-dialog';
import { TestSampleDataViewer } from '../test-sample-data-viewer';
import { testStepHooks } from '../test-step-hooks';

import { FirstTimeTestingSection } from './first-time-testing-section';
import { SimulationSection } from './simulation-section';

type TestTriggerSectionProps = {
  isSaving: boolean;
  flowVersionId: string;
  flowId: string;
  projectId: string;
};

function getSelectedId(
  sampleData: unknown,
  pollResults: TriggerEventWithPayload[],
) {
  if (sampleData === undefined) {
    return undefined;
  }
  return pollResults.find((result) => deepEqual(sampleData, result.payload))
    ?.id;
}

const TestTriggerSection = React.memo(
  ({ isSaving, flowVersionId, flowId }: TestTriggerSectionProps) => {
    const form = useFormContext<Trigger>();
    const formValues = form.getValues();
    const isValid = form.formState.isValid;
    const abortControllerRef = useRef<AbortController>(new AbortController());
    const lastTestDate = formValues.settings.inputUiInfo?.lastTestDate;

    const [isMcpToolTestingDialogOpen, setIsMcpToolTestingDialogOpen] =
      useState(false);

    const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
      name: formValues.settings.pieceName,
      version: formValues.settings.pieceVersion,
    });

    const mockData =
      pieceModel?.triggers?.[formValues.settings.triggerName]?.sampleData;
    const isMcpTool = formValues.settings.triggerName === 'mcp_tool';
    const isSimulation =
      pieceModel?.triggers?.[formValues.settings.triggerName]?.testStrategy ===
        TriggerTestStrategy.SIMULATION && !isMcpTool;
    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );

    const { sampleData, sampleDataInput } = useBuilderStateContext((state) => {
      return {
        sampleData: state.sampleData[formValues.name],
        sampleDataInput: state.sampleDataInput[formValues.name],
      };
    });

    const onTestSuccess = async () => {
      form.setValue(`settings.inputUiInfo.lastTestDate`, dayjs().toISOString());
      await refetch();
    };

    const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
      testStepHooks.useSaveMockData({
        onSuccess: onTestSuccess,
      });

    const [isWebhookTestingDialogOpen, setIsWebhookTestingDialogOpen] =
      useState(false);
    const {
      mutate: simulateTrigger,
      isPending: isSimulating,
      reset: resetSimulation,
    } = testStepHooks.useSimulateTrigger({
      setErrorMessage,
      onSuccess: async () => {
        await onTestSuccess();
        setIsWebhookTestingDialogOpen(false);
      },
    });
    const { mutate: pollTrigger, isPending: isPollingTesting } =
      testStepHooks.usePollTrigger({
        setErrorMessage,
        onSuccess: onTestSuccess,
      });

    const { mutate: updateSampleData } = testStepHooks.useUpdateSampleData(
      formValues.name,
      (step) => {
        const sampleDataFileId = step.settings.inputUiInfo?.sampleDataFileId;
        const sampleDataInputFileId =
          step.settings.inputUiInfo?.sampleDataInputFileId;
        form.setValue(
          'settings.inputUiInfo',
          {
            ...formValues.settings.inputUiInfo,
            sampleDataFileId,
            sampleDataInputFileId,
            currentSelectedData: undefined,
            lastTestDate: dayjs().toISOString(),
          },
          { shouldValidate: true },
        );
      },
    );
    const { data: pollResults, refetch } = useQuery<
      SeekPage<TriggerEventWithPayload>
    >({
      queryKey: ['triggerEvents', flowVersionId],
      queryFn: () =>
        triggerEventsApi.list({
          flowId: flowId,
          limit: 5,
          cursor: undefined,
        }),
      staleTime: 0,
    });

    const sampleDataSelected = !isNil(lastTestDate) || !isNil(errorMessage);

    const isTestedBefore = !isNil(
      form.getValues().settings.inputUiInfo?.lastTestDate,
    );
    const selectedId = useMemo(
      () => getSelectedId(sampleData, pollResults?.data ?? []),
      [sampleData, pollResults],
    );

    if (isPieceLoading) {
      return null;
    }
    const showSampleDataViewer =
      sampleDataSelected && !isSimulating && !isSavingMockdata;
    const showSimulationSection = isSimulation && isSimulating;
    const showFirstTimeTestingSectionForSimulation =
      !isTestedBefore && !sampleDataSelected && isSimulation && !isSimulating;

    const showFirstTimeTestingSectionForPolling =
      !isTestedBefore &&
      !sampleDataSelected &&
      !isSimulation &&
      !isSimulating &&
      !isMcpTool;
    const showFirstTimeMcpToolTestingSection =
      !isTestedBefore && !sampleDataSelected && isMcpTool;
    const isWebhookPieceTrigger =
      pieceModel?.name === '@activepieces/piece-webhook' &&
      formValues.settings.triggerName === 'catch_webhook';

    const handleMcpToolTesting = () => {
      setIsMcpToolTestingDialogOpen(true);
    };

    return (
      <div>
        {showSampleDataViewer && (
          <TestSampleDataViewer
            onRetest={
              isSimulation
                ? () => {
                    simulateTrigger(abortControllerRef.current.signal);
                  }
                : isMcpTool
                ? handleMcpToolTesting
                : pollTrigger
            }
            isValid={isValid}
            isTesting={isPollingTesting}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
            isSaving={isSaving}
          >
            {pollResults?.data && (
              <div className="mb-3">
                <Select
                  value={selectedId}
                  onValueChange={(value) => {
                    const triggerEvent = pollResults?.data.find(
                      (triggerEvent) => triggerEvent.id === value,
                    );
                    if (triggerEvent) {
                      updateSampleData({
                        response: {
                          output: triggerEvent.payload,
                          success: true,
                        },
                      });
                    }
                  }}
                >
                  <SelectTrigger
                    className="w-full"
                    disabled={pollResults && pollResults.data.length === 0}
                  >
                    {pollResults && pollResults.data.length > 0 ? (
                      <SelectValue
                        placeholder={t('No sample data available')}
                      ></SelectValue>
                    ) : (
                      t('Old results were removed, retest for new sample data')
                    )}
                  </SelectTrigger>
                  <SelectContent>
                    {pollResults &&
                      pollResults.data.map((triggerEvent, index) => (
                        <SelectItem
                          key={triggerEvent.id}
                          value={triggerEvent.id}
                        >
                          {t('Result #') + (index + 1)}
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
                <span className="text-sm mt-2 text-muted-foreground">
                  {t('The sample data can be used in the next steps.')}
                </span>
              </div>
            )}
          </TestSampleDataViewer>
        )}

        {showSimulationSection && (
          <SimulationSection
            isWebhookPieceTrigger={isWebhookPieceTrigger}
            pieceModel={pieceModel}
            triggerName={formValues.settings.triggerName}
            isWebhookTestingDialogOpen={isWebhookTestingDialogOpen}
            setIsWebhookTestingDialogOpen={setIsWebhookTestingDialogOpen}
            resetSimulation={resetSimulation}
            abortControllerRef={abortControllerRef}
          />
        )}

        {(showFirstTimeTestingSectionForSimulation ||
          showFirstTimeTestingSectionForPolling ||
          showFirstTimeMcpToolTestingSection) && (
          <FirstTimeTestingSection
            isValid={isValid}
            isSimulation={isSimulation}
            isMcpTool={isMcpTool}
            isPollingTesting={isPollingTesting}
            isMcpToolTestingDialogOpen={isMcpToolTestingDialogOpen}
            mockData={mockData}
            isSavingMockdata={isSavingMockdata}
            onSimulateTrigger={() =>
              simulateTrigger(abortControllerRef.current.signal)
            }
            onPollTrigger={pollTrigger}
            onMcpToolTesting={handleMcpToolTesting}
            onSaveMockAsSampleData={saveMockAsSampleData}
          />
        )}

        {isMcpTool && (
          <McpToolTestingDialog
            open={isMcpToolTestingDialogOpen}
            onOpenChange={setIsMcpToolTestingDialogOpen}
            onTestingSuccess={onTestSuccess}
          />
        )}
      </div>
    );
  },
);
TestTriggerSection.displayName = 'TestTriggerSection';

export { TestTriggerSection };
