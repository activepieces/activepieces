import { useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { AlertCircle, ChevronDown } from 'lucide-react';
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
  ApFlagId,
  SeekPage,
  Trigger,
  TriggerEventWithPayload,
  TriggerTestStrategy,
  isNil,
} from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { DefaultTestingButton, TestSampleDataViewer } from './test-sample-data-viewer';
import testStepHooks from './test-step-hooks';
import { TestButtonTooltip } from './test-step-tooltip';
import TestWebhookDialog from './custom-test-step/test-webhook-dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { flagsHooks } from '@/hooks/flags-hooks';

type TestTriggerSectionProps = {
  isSaving: boolean;
  flowVersionId: string;
  flowId: string;
  projectId: string;
};




type WebhookPieceTestingButtonProps = {
  simulateTrigger: () => void;
  setIsWebhookTestingDialogOpen: (isOpen: boolean) => void;
  isWebhookTestingDialogOpen: boolean;
  formValues: Trigger;
  refetch: () => void;
  isForRetest: boolean;
};
const WebhookPieceTestingButton = ({ simulateTrigger, setIsWebhookTestingDialogOpen, isWebhookTestingDialogOpen, formValues, refetch, isForRetest }: WebhookPieceTestingButtonProps) => {
  return <>
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          className='flex items-center gap-2'
        >
          {!isForRetest && <Dot animation={true} variant={'primary'}></Dot>}
          {isForRetest ? t('Retest') : t('Test Webhook')}
          <ChevronDown className='w-4 h-4' />
        </Button>

      </DropdownMenuTrigger>

      <DropdownMenuContent>
        <DropdownMenuItem onClick={() => {
          simulateTrigger()
        }}>
          {t('Send Data from an outside source')}
        </DropdownMenuItem>
        <DropdownMenuItem onClick={() => {
          setIsWebhookTestingDialogOpen(true)
        }}>
          {t('Generate Sample Data')}
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>


    <TestWebhookDialog
      open={isWebhookTestingDialogOpen}
      onOpenChange={setIsWebhookTestingDialogOpen}
      testingMode='trigger'
      currentStep={formValues}
      onTestFinished={() => {
        refetch()
      }}
    />
  </>
}

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

    const lastTestDate = formValues.settings.inputUiInfo?.lastTestDate

    const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
      name: formValues.settings.pieceName,
      version: formValues.settings.pieceVersion,
    });

    const isSimulation =
      pieceModel?.triggers?.[formValues.settings.triggerName]?.testStrategy ===
      TriggerTestStrategy.SIMULATION;
    const mockData =
      pieceModel?.triggers?.[formValues.settings.triggerName]?.sampleData;

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
      !isTestedBefore && !sampleDataSelected && !isSimulation && !isSimulating;
    const isWebhookPieceTrigger = pieceModel?.name === '@activepieces/piece-webhook' && formValues.settings.triggerName === 'catch_webhook';
    const [isWebhookTestingDialogOpen, setIsWebhookTestingDialogOpen] = useState(false);
    const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
      ApFlagId.WEBHOOK_URL_PREFIX,
    );

    return (
      <div>
        {showSampleDataViewer && (
          <TestSampleDataViewer
            isValid={isValid}
            isTesting={isPollingTesting}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            errorMessage={errorMessage}
            lastTestDate={lastTestDate}
            retestButton={
              isWebhookPieceTrigger ? (
                <WebhookPieceTestingButton
                  simulateTrigger={simulateTrigger}
                  setIsWebhookTestingDialogOpen={setIsWebhookTestingDialogOpen}
                  isWebhookTestingDialogOpen={isWebhookTestingDialogOpen}
                  formValues={formValues}
                  refetch={refetch}
                  isForRetest={true}
                />
              ) : (
                <DefaultTestingButton
                isValid={isValid}
                isSaving={isSaving}
                isTesting={isPollingTesting}
                onRetest={isSimulation ? simulateTrigger : pollTrigger}
              />)
            
            }
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
                  {!isWebhookPieceTrigger && (t('testPieceWebhookTriggerNote', {
                    pieceName: pieceModel.displayName,
                    triggerName:
                      pieceModel.triggers[formValues.settings.triggerName]
                        .displayName,
                  }))}

                  {
                    isWebhookPieceTrigger && (<>
                      <div className='break-wrods'>
                        {t('Please send data to the webhook url to test the trigger:')}
                      </div>
                      <div className='break-all'>
                        {`${webhookPrefixUrl}/${flowId}`}
                      </div>
                    </>
                    )
                  }



                </AlertDescription>
              </div>
            </Alert>
          </div>
        )}
        {showFirstTimeTestingSectionForSimulation && (
          <div className="flex justify-center flex-col gap-2 items-center">
            {!isWebhookPieceTrigger && (
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
            )
            }

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

            {
              isWebhookPieceTrigger && (
                <WebhookPieceTestingButton
                  simulateTrigger={simulateTrigger}
                  setIsWebhookTestingDialogOpen={setIsWebhookTestingDialogOpen}
                  isWebhookTestingDialogOpen={isWebhookTestingDialogOpen}
                  formValues={formValues}
                  refetch={refetch}
                  isForRetest={false}
                />
              )
            }
          </div>
        )}
        {showFirstTimeTestingSectionForPolling && (
          <div className="flex justify-center">
            <TestButtonTooltip disabled={!isValid}>
              <Button
                variant="outline"
                size="sm"
                onClick={() => pollTrigger()}
                keyboardShortcut="G"
                onKeyboardShortcut={pollTrigger}
                loading={isPollingTesting}
                disabled={!isValid}
              >
                <Dot animation={true} variant={'primary'}></Dot>
                {t('Load Sample Data')}
              </Button>
            </TestButtonTooltip>
          </div>
        )}
      </div>
    );
  },
);
TestTriggerSection.displayName = 'TestTriggerSection';

export { TestTriggerSection };
