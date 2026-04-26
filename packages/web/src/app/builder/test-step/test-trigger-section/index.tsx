import { FlowTrigger, flowStructureUtil, isNil } from '@activepieces/shared';
import { t } from 'i18next';
import React, { useRef, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { ChatDrawerSource } from '@/app/builder/types';
import { triggerEventHooks } from '@/features/flows';
import { piecesHooks } from '@/features/pieces';

import { useBuilderStateContext } from '../../builder-hooks';
import { McpToolTestingDialog } from '../custom-test-step/mcp-tool-testing-dialog';
import { TestSampleDataViewer } from '../test-sample-data-viewer';
import { testStepHooks } from '../utils/test-step-hooks';

import { FirstTimeTestingSection } from './first-time-testing-section';
import { ManualWebhookTestButton } from './manual-webhook-test-button';
import { SimulationNote } from './simulation-section';
import { TriggerEventSelect } from './trigger-event-select';
import { TestType, triggerEventUtils } from './trigger-event-utils';

type TestTriggerSectionProps = {
  isSaving: boolean;
  flowVersionId: string;
  flowId: string;
  projectId: string;
};

const TestTriggerSection = React.memo(
  ({ isSaving, flowVersionId, flowId }: TestTriggerSectionProps) => {
    const form = useFormContext<Pick<FlowTrigger, 'name' | 'settings'>>();
    const formValues = form.getValues();
    const isValid = form.formState.isValid;
    const abortControllerRef = useRef<AbortController>(new AbortController());
    const [isTestingDialogOpen, setIsTestingDialogOpen] = useState(false);
    const { pieceModel, isLoading: isPieceLoading } = piecesHooks.usePiece({
      name: formValues.settings.pieceName,
      version: formValues.settings.pieceVersion,
    });

    const trigger = pieceModel?.triggers?.[formValues.settings.triggerName];
    const mockData =
      pieceModel?.triggers?.[formValues.settings.triggerName]?.sampleData;

    const [errorMessage, setErrorMessage] = useState<string | undefined>(
      undefined,
    );

    const {
      sampleData,
      sampleDataInput,
      setChatDrawerOpenSource,
      lastTestDate,
    } = useBuilderStateContext((state) => {
      const step = flowStructureUtil.getStep(
        formValues.name,
        state.flowVersion.trigger,
      );
      return {
        sampleData: state.outputSampleData[formValues.name],
        sampleDataInput: state.inputSampleData[formValues.name],
        setChatDrawerOpenSource: state.setChatDrawerOpenSource,
        lastTestDate: step?.settings?.sampleData?.lastTestDate,
      };
    });

    const onTestSuccess = async () => {
      await refetch();
    };

    const { mutate: saveMockAsSampleData, isPending: isSavingMockdata } =
      testStepHooks.useSaveMockData({
        onSuccess: onTestSuccess,
      });

    const {
      mutate: simulateTrigger,
      isPending: isSimulating,
      reset: resetSimulation,
    } = testStepHooks.useSimulateTrigger({
      setErrorMessage,
      onSuccess: async () => {
        await onTestSuccess();
        setIsTestingDialogOpen(false);
      },
    });
    const { mutate: pollTrigger, isPending: isPollingTesting } =
      testStepHooks.usePollTrigger({
        setErrorMessage,
        onSuccess: onTestSuccess,
      });

    const { pollResults, refetch } = triggerEventHooks.usePollResults(
      flowVersionId,
      flowId,
    );

    const sampleDataSelected = !isNil(lastTestDate) || !isNil(errorMessage);

    const isTestedBefore = !isNil(lastTestDate);
    const showFirstTimeTestingSection = !isTestedBefore && !isSimulating;

    if (isPieceLoading || isNil(trigger)) {
      return null;
    }
    const testType: TestType = triggerEventUtils.getTestType({
      triggerName: formValues.settings.triggerName,
      pieceName: formValues.settings.pieceName,
      trigger: trigger,
    });

    const showSampleDataViewer =
      sampleDataSelected && !isSimulating && !isSavingMockdata;

    const onTest = () => {
      switch (testType) {
        case 'chat-trigger':
          setChatDrawerOpenSource(ChatDrawerSource.TEST_STEP);
          simulateTrigger(abortControllerRef.current.signal);
          break;
        case 'simulation':
        case 'webhook':
          simulateTrigger(abortControllerRef.current.signal);
          break;
        case 'polling':
          pollTrigger();
          break;
        case 'mcp-tool':
          setIsTestingDialogOpen(true);
          break;
      }
    };
    const getSimulationNote = () => {
      switch (testType) {
        case 'simulation':
          return t('testPieceWebhookTriggerNote', {
            pieceName: pieceModel?.displayName,
            triggerName:
              pieceModel?.triggers[formValues.settings.triggerName].displayName,
          });
        case 'webhook':
          return (
            <div className="flex flex-col gap-2">
              <p>
                {t(
                  'Send Data to the webhook URL to generate sample data to use in the next steps',
                )}
              </p>
              <ManualWebhookTestButton
                isWebhookTestingDialogOpen={isTestingDialogOpen}
                setIsWebhookTestingDialogOpen={(value) => {
                  setIsTestingDialogOpen(value);
                  if (!value) {
                    abortControllerRef.current.abort();
                    abortControllerRef.current = new AbortController();
                  }
                }}
              />
            </div>
          );
        default:
          return null;
      }
    };

    return (
      <div>
        {showFirstTimeTestingSection && !errorMessage && (
          <FirstTimeTestingSection
            isValid={isValid}
            testType={testType}
            isTesting={isPollingTesting || isSimulating || isTestingDialogOpen}
            mockData={mockData}
            isSaving={isSaving || isSavingMockdata}
            onSimulateTrigger={() => {
              if (testType === 'chat-trigger') {
                setChatDrawerOpenSource(ChatDrawerSource.TEST_STEP);
              }
              simulateTrigger(abortControllerRef.current.signal);
            }}
            onPollTrigger={pollTrigger}
            onMcpToolTesting={() => setIsTestingDialogOpen(true)}
            onSaveMockAsSampleData={saveMockAsSampleData}
          />
        )}
        {(!showFirstTimeTestingSection || errorMessage) && (
          <>
            {showSampleDataViewer && (
              <TestSampleDataViewer
                onRetest={onTest}
                hideCancel={true}
                isValid={isValid}
                consoleLogs={null}
                isTesting={isPollingTesting}
                sampleData={sampleData}
                sampleDataInput={sampleDataInput ?? null}
                errorMessage={errorMessage ?? null}
                lastTestDate={lastTestDate}
                isSaving={isSaving}
                pieceName={formValues.settings.pieceName}
                stepName={formValues.settings.triggerName}
                pieceHints={trigger?.outputDisplayHints ?? null}
              >
                {pollResults?.data && !errorMessage && (
                  <TriggerEventSelect
                    pollResults={pollResults}
                    sampleData={sampleData}
                  />
                )}
              </TestSampleDataViewer>
            )}

            {isSimulating && (
              <SimulationNote
                note={getSimulationNote()}
                resetSimulation={resetSimulation}
                abortControllerRef={abortControllerRef}
              />
            )}
          </>
        )}
        {testType === 'mcp-tool' && (
          <McpToolTestingDialog
            open={isTestingDialogOpen}
            onOpenChange={setIsTestingDialogOpen}
            onTestingSuccess={onTestSuccess}
          />
        )}
      </div>
    );
  },
);
TestTriggerSection.displayName = 'TestTriggerSection';

export { TestTriggerSection };
