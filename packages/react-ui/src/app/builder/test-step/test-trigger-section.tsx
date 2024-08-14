import {
  SeekPage,
  Trigger,
  TriggerEvent,
  TriggerTestStrategy,
  isNil,
} from '@activepieces/shared';
import { useMutation, useQuery } from '@tanstack/react-query';
import dayjs from 'dayjs';
import deepEqual from 'deep-equal';
import { AlertCircle } from 'lucide-react';
import React, { useEffect, useState } from 'react';
import { useFormContext, useWatch } from 'react-hook-form';

import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';
import { testStepUtils } from './test-step-utils';

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
import { formatUtils } from '@/lib/utils';

type TestTriggerSectionProps = {
  isSaving: boolean;
  flowVersionId: string;
  flowId: string;
};

function getSelectedId(
  currentSelectedData: unknown,
  pollResults: TriggerEvent[],
) {
  if (currentSelectedData === undefined) {
    return undefined;
  }
  for (let i = 0; i < pollResults.length; i++) {
    if (deepEqual(currentSelectedData, pollResults[i].payload)) {
      return pollResults[i].id;
    }
  }
  return undefined;
}
const TestTriggerSection = React.memo(
  ({ isSaving, flowVersionId, flowId }: TestTriggerSectionProps) => {
    const form = useFormContext<Trigger>();
    const formValues = form.getValues();
    const [isValid, setIsValid] = useState(false);

    const [lastTestDate, setLastTestDate] = useState(
      formValues.settings.inputUiInfo?.lastTestDate,
    );

    const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
      name: formValues.settings.pieceName,
      version: formValues.settings.pieceVersion,
    });

    const isSimulation =
      pieceModel?.triggers?.[formValues.settings.triggerName]?.testStrategy ===
      TriggerTestStrategy.SIMULATION;

    useEffect(() => {
      setIsValid(form.formState.isValid);
    }, [form.formState.isValid]);

    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );

    const [currentSelectedData, setCurrentSelectedData] =
      useState<unknown>(undefined);

    const [currentSelectedId, setCurrentSelectedId] = useState<
      string | undefined
    >(undefined);

    const {
      mutate: simulateTrigger,
      isPending: isSimulating,
      reset: resetSimulation,
    } = useMutation<TriggerEvent[], Error, void>({
      mutationFn: async () => {
        setErrorMessage(undefined);
        const ids = (
          await triggerEventsApi.list({ flowId, cursor: undefined, limit: 5 })
        ).data.map((triggerEvent) => triggerEvent.id);
        await triggerEventsApi.startWebhookSimulation(flowId);
        // TODO REFACTOR: replace this with a websocket
        let attempt = 0;
        while (attempt < 30) {
          const newData = await triggerEventsApi.list({
            flowId,
            cursor: undefined,
            limit: 5,
          });
          const newIds = newData.data.map((triggerEvent) => triggerEvent.id);
          if (!deepEqual(ids, newIds)) {
            return newData.data;
          }
          await new Promise((resolve) => setTimeout(resolve, 2000));
          attempt++;
        }
        await triggerEventsApi.deleteWebhookSimulation(flowId);
        return [];
      },
      onSuccess: (results) => {
        if (results.length > 0) {
          updateCurrentSelectedData(results[0]);
          refetch();
        }
      },
      onError: (error) => {
        console.error(error);
        setErrorMessage(
          testStepUtils.formatErrorMessage(
            'There is no sample data available found for this trigger.',
          ),
        );
      },
    });

    const { mutate: pollTrigger, isPending: isPollingTesting } = useMutation<
      SeekPage<TriggerEvent>,
      Error,
      void
    >({
      mutationFn: async () => {
        setErrorMessage(undefined);
        return triggerEventsApi.pollTrigger({
          flowId,
        });
      },
      onSuccess: (results) => {
        if (results.data.length > 0) {
          updateCurrentSelectedData(results.data[0]);
          refetch();
        }
      },
      onError: (error) => {
        console.error(error);
        setErrorMessage(
          testStepUtils.formatErrorMessage(
            'Failed to run test step, please ensure settings are correct.',
          ),
        );
      },
    });

    function updateCurrentSelectedData(data: TriggerEvent) {
      form.setValue(
        'settings.inputUiInfo',
        {
          ...formValues.settings.inputUiInfo,
          currentSelectedData: formatUtils.formatStepInputAndOutput(
            data.payload,
            null,
          ),
          lastTestDate: dayjs().toISOString(),
        },
        { shouldValidate: true },
      );
      setLastTestDate(dayjs().toISOString());
    }

    const { data: pollResults, refetch } = useQuery<SeekPage<TriggerEvent>>({
      queryKey: ['triggerEvents', flowVersionId],
      queryFn: () =>
        triggerEventsApi.list({
          flowId: flowId,
          limit: 5,
          cursor: undefined,
        }),
      staleTime: 0,
    });

    const sampleDataSelected =
      !isNil(currentSelectedData) || !isNil(errorMessage);
    const isTestedBefore = pollResults && pollResults.data.length > 0;

    const watchSelectedData = useWatch({
      name: 'settings.inputUiInfo.currentSelectedData',
      control: form.control,
    });

    useEffect(() => {
      const selectedId = getSelectedId(
        currentSelectedData,
        pollResults?.data ?? [],
      );
      setCurrentSelectedId(selectedId);
    }, [currentSelectedData, pollResults]);

    useEffect(() => {
      setErrorMessage(undefined);
      setCurrentSelectedData(watchSelectedData);
    }, [watchSelectedData]);

    if (isPieceLoading) {
      return <></>;
    }

    return (
      <>
        {isTestedBefore && (
          <>
            <Select
              value={currentSelectedId}
              onValueChange={(value) => {
                const triggerEvent = pollResults.data.find(
                  (triggerEvent) => triggerEvent.id === value,
                );
                if (triggerEvent) {
                  updateCurrentSelectedData(triggerEvent);
                }
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Select a sample data" />
              </SelectTrigger>
              <SelectContent>
                {pollResults &&
                  pollResults.data.map((triggerEvent, index) => (
                    <SelectItem key={triggerEvent.id} value={triggerEvent.id}>
                      {'Result #' + (index + 1)}
                    </SelectItem>
                  ))}
              </SelectContent>
            </Select>
            <span className="text-sm text-muted-foreground">
              The sample data can be used in the next steps.
            </span>
          </>
        )}
        <div className="flex-grow flex justify-center items-center w-full h-full">
          {sampleDataSelected && !isSimulating && (
            <TestSampleDataViewer
              onRetest={isSimulation ? simulateTrigger : pollTrigger}
              isValid={isValid}
              isSaving={isSaving}
              isTesting={isPollingTesting}
              currentSelectedData={currentSelectedData}
              errorMessage={errorMessage}
              lastTestDate={lastTestDate}
              type={formValues.type}
            ></TestSampleDataViewer>
          )}

          {isSimulation && isSimulating && (
            <div className="flex flex-col gap-4 w-full">
              <div className="flex gap-2 items-center justify-center w-full">
                <LoadingSpinner className="w-4 h-4"></LoadingSpinner>
                <div>Testing Trigger</div>
                <div className="flex-grow"></div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    resetSimulation();
                  }}
                >
                  {' '}
                  Cancel{' '}
                </Button>
              </div>
              <Alert>
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>Action Required!</AlertTitle>
                <AlertDescription>
                  Perform the action you want to test.
                </AlertDescription>
              </Alert>
            </div>
          )}
          {!isTestedBefore &&
            !sampleDataSelected &&
            isSimulation &&
            !isSimulating && (
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
                  Test Trigger
                </Button>
              </TestButtonTooltip>
            )}
          {!isTestedBefore && !sampleDataSelected && !isSimulation && (
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
                Load Sample Data
              </Button>
            </TestButtonTooltip>
          )}
        </div>
      </>
    );
  },
);
TestTriggerSection.displayName = 'TestTriggerSection';

export { TestTriggerSection };
