import { useQuery } from '@tanstack/react-query';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { AlertCircle } from 'lucide-react';
import React, { useMemo, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Dot } from '@/components/ui/dot';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { LoadingSpinner } from '@/components/ui/spinner';
import { triggerEventsApi } from '@/features/flows/lib/trigger-events-api';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import {
  SeekPage,
  Trigger,
  TriggerEventWithPayload,
  TriggerTestStrategy,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { McpToolTestingDialog } from './custom-test-step/mcp-tool-testing-dialog';
import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import testStepHooks from './test-step-hooks';
import { TestButtonTooltip } from './test-step-tooltip';

type TestTriggerSectionProps = {
  isSaving: boolean;
  flowVersionId: string;
  flowId: string;
  projectId: string;
};

const ManualWebhookPieceTriggerTestButton = ({
  refetch,
}: {
  refetch: () => void;
}) => {
  const [id, setId] = useState<number>(0);
  const [isWebhookTestingDialogOpen, setIsWebhookTestingDialogOpen] =
    useState(false);
  const formValues = useFormContext<Trigger>().getValues();

  return (
    <>
      <Button
        variant="default"
        size="sm"
        className="flex items-center gap-2"
        onClick={() => {
          setIsWebhookTestingDialogOpen(true);
        }}
      >
        {t('Generate Sample Data')}
      </Button>

      <TestWebhookDialog
        key={`test-webhook-dialog-${id}`}
        open={isWebhookTestingDialogOpen}
        onOpenChange={(val) => {
          if (!val) {
            setTimeout(() => {
              setId(id + 1);
            }, 200);
          }
          setIsWebhookTestingDialogOpen(val);
        }}
        testingMode="trigger"
        currentStep={formValues}
        onTestFinished={() => {
          refetch();
        }}
      />
    </>
  );
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

    const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
      testStepHooks.useSaveMockData({
        onSuccess: () => {
          refetch();
        },
      });

    const {
      mutate: simulateTrigger,
      isPending: isSimulating,
      reset: resetSimulation,
    } = testStepHooks.useSimulateTrigger({
      setErrorMessage,
      onSuccess: () => {
        refetch();
      },
    });

    const { mutate: pollTrigger, isPending: isPollingTesting } =
      testStepHooks.usePollTrigger({
        setErrorMessage,
        onSuccess: () => {
          refetch();
        },
      });

    const { mutate: updateTriggerSampleData } =
      testStepHooks.useUpdateTriggerSampleData();
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
                ? simulateTrigger
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
                      updateTriggerSampleData(triggerEvent);
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
          <div className="flex flex-col gap-4 w-full">
            <div className="flex gap-2 items-center justify-center w-full">
              <LoadingSpinner className="w-4 h-4"></LoadingSpinner>
              <div>{t('Testing Trigger')}</div>
              <div className="flex-grow"></div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  resetSimulation();
                }}
              >
                {t('Cancel')}
              </Button>
            </div>

            <Alert className="bg-warning/5 border-warning/5 ">
              <AlertCircle className="h-4 w-4 text-warning" />
              <div className="flex flex-col gap-1">
                <AlertTitle>{t('Action Required')}:</AlertTitle>
                <AlertDescription>
                  {!isWebhookPieceTrigger &&
                    t('testPieceWebhookTriggerNote', {
                      pieceName: pieceModel.displayName,
                      triggerName:
                        pieceModel.triggers[formValues.settings.triggerName]
                          .displayName,
                    })}

                  {isWebhookPieceTrigger && (
                    <div className="break-wrods">
                      {t(
                        'Send Data to the webhook URL to generate sample data to use in the next steps',
                      )}
                    </div>
                  )}
                </AlertDescription>
              </div>
            </Alert>
            {isWebhookPieceTrigger && (
              <ManualWebhookPieceTriggerTestButton refetch={refetch} />
            )}
          </div>
        )}
        {showFirstTimeTestingSectionForSimulation && (
          <div className="flex justify-center flex-col gap-2 items-center">
            <TestButtonTooltip disabled={!isValid}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => simulateTrigger()}
                keyboardShortcut="G"
                onKeyboardShortcut={simulateTrigger}
                disabled={!isValid}
              >
                <Dot animation={true} variant={'primary'}></Dot>
                {t('Test Trigger')}
              </Button>
            </TestButtonTooltip>

            {!isNil(mockData) && (
              <>
                {t('Or')}
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => saveMockAsSampleData(mockData)}
                  loading={isSavingMockdata}
                >
                  {t('Use Mock Data')}
                </Button>
              </>
            )}
          </div>
        )}
        {showFirstTimeTestingSectionForPolling && (
          <div className="flex justify-center">
            <TestButtonTooltip disabled={!isValid}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  pollTrigger();
                }}
                keyboardShortcut="G"
                onKeyboardShortcut={pollTrigger}
                loading={isPollingTesting || isMcpToolTestingDialogOpen}
                disabled={!isValid}
              >
                <Dot animation={true} variant={'primary'}></Dot>
                {t('Load Sample Data')}
              </Button>
            </TestButtonTooltip>
          </div>
        )}
        {showFirstTimeMcpToolTestingSection && (
          <div className="flex justify-center">
            <TestButtonTooltip disabled={!isValid}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  handleMcpToolTesting();
                }}
                keyboardShortcut="G"
                onKeyboardShortcut={handleMcpToolTesting}
                loading={isPollingTesting || isMcpToolTestingDialogOpen}
                disabled={!isValid}
              >
                <Dot animation={true} variant={'primary'}></Dot>
                {t('Test Tool')}
              </Button>
            </TestButtonTooltip>
          </div>
        )}

        {isMcpTool && (
          <McpToolTestingDialog
            open={isMcpToolTestingDialogOpen}
            onOpenChange={setIsMcpToolTestingDialogOpen}
            onTestingSuccess={() => {
              refetch();
            }}
          />
        )}
      </div>
    );
  },
);
TestTriggerSection.displayName = 'TestTriggerSection';

export { TestTriggerSection };
