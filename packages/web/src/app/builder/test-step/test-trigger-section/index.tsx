import {
  FlowTrigger,
  FlowTriggerType,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { Zap } from 'lucide-react';
import React from 'react';

import { triggerEventHooks } from '@/features/flows';

import { useBuilderStateContext } from '../../builder-hooks';
import { StepDataPanelHeader } from '../../step-data/step-data-panel-header';
import { StepDataPanelViewToggle } from '../../step-data/step-data-panel-view-toggle';
import { stepPropertiesSnapshotUtils } from '../../data-display/build-step-properties-snapshot';
import { ErrorExplanationContext } from '../../data-display/explanation-prompt';
import { useTriggerTestRunner } from '../test-runner-context';
import { TestSampleDataViewer } from '../test-sample-data-viewer';

import { FirstTimeTestingSection } from './first-time-testing-section';
import { ManualWebhookTestButton } from './manual-webhook-test-button';
import { SimulationNote } from './simulation-section';
import { TriggerEventSelect } from './trigger-event-select';

type TestTriggerSectionProps = {
  isSaving: boolean;
  flowVersionId: string;
  flowId: string;
  projectId: string;
};

const TestTriggerSection = React.memo(
  ({ isSaving, flowVersionId, flowId }: TestTriggerSectionProps) => {
    const runner = useTriggerTestRunner();
    const currentStep = useBuilderStateContext((state) =>
      state.selectedStep
        ? flowStructureUtil.getStep(
            state.selectedStep,
            state.flowVersion.trigger,
          )
        : null,
    );

    const stepName = currentStep?.name;
    const { sampleData, sampleDataInput, lastTestDate } =
      useBuilderStateContext((state) => ({
        sampleData: stepName ? state.outputSampleData[stepName] : undefined,
        sampleDataInput: stepName ? state.inputSampleData[stepName] : undefined,
        lastTestDate:
          stepName && state.selectedStep
            ? findTriggerLastTestDate(state.flowVersion.trigger, stepName)
            : undefined,
      }));

    const { pollResults } = triggerEventHooks.usePollResults(
      flowVersionId,
      flowId,
    );

    if (!runner || !currentStep || currentStep.type !== FlowTriggerType.PIECE) {
      return null;
    }

    const {
      pieceModel,
      isPieceLoading,
      testType,
      mockData,
      isValid,
      isSimulating,
      isSavingMockdata,
      isPollingTesting,
      errorMessage,
      isTestingDialogOpen,
      setIsTestingDialogOpen,
      abortControllerRef,
      saveMockAsSampleData,
      resetSimulation,
      fireTest,
    } = runner;

    const sampleDataSelected = !isNil(lastTestDate) || !isNil(errorMessage);
    const isTestedBefore = !isNil(lastTestDate);
    const showFirstTimeTestingSection = !isTestedBefore && !isSimulating;

    if (isPieceLoading || isNil(testType)) {
      return (
        <div className="flex flex-col h-full">
          <StepDataPanelHeader status="idle" />
          <div className="flex justify-end px-3 py-2 shrink-0">
            <StepDataPanelViewToggle />
          </div>
        </div>
      );
    }

    const showSampleDataViewer =
      sampleDataSelected && !isSimulating && !isSavingMockdata;

    const triggerName = currentStep.settings.triggerName;
    const triggerInput = currentStep.settings.input as
      | Record<string, unknown>
      | undefined;
    const explanationContext: ErrorExplanationContext = {
      pieceName: currentStep.settings.pieceName,
      pieceVersion: currentStep.settings.pieceVersion,
      pieceDisplayName: pieceModel?.displayName,
      pieceAuthType: stepPropertiesSnapshotUtils.findAuthType(pieceModel),
      stepKind: 'trigger',
      stepName: triggerName,
      stepDisplayName: currentStep.displayName,
      stepDescription: stepPropertiesSnapshotUtils.findDescription({
        pieceModel,
        stepKind: 'trigger',
        stepName: triggerName,
      }),
      stepProperties: stepPropertiesSnapshotUtils.build({
        pieceModel,
        stepKind: 'trigger',
        stepName: triggerName,
        input: triggerInput,
      }),
    };

    const getSimulationNote = () => {
      switch (testType) {
        case 'simulation':
          return t('testPieceWebhookTriggerNote', {
            pieceName: pieceModel?.displayName,
            triggerName: triggerName
              ? pieceModel?.triggers[triggerName]?.displayName
              : undefined,
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
      <div className="flex flex-col h-full">
        {showFirstTimeTestingSection && !errorMessage && (
          <div className="flex flex-col h-full">
            <StepDataPanelHeader status="idle" />
            <div className="flex justify-end px-3 py-2 shrink-0">
              <StepDataPanelViewToggle />
            </div>
            <div className="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
                <Zap className="size-6" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-[280px]">
                <span className="text-sm font-medium text-foreground">
                  {t('No sample data yet')}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'Test the trigger to capture sample data. You can then use the result in the following steps.',
                  )}
                </span>
              </div>
              <FirstTimeTestingSection
                isValid={isValid}
                testType={testType}
                isTesting={
                  isPollingTesting || isSimulating || isTestingDialogOpen
                }
                mockData={mockData}
                isSaving={isSaving || isSavingMockdata}
                onSimulateTrigger={fireTest}
                onPollTrigger={fireTest}
                onMcpToolTesting={fireTest}
                onSaveMockAsSampleData={saveMockAsSampleData}
              />
            </div>
          </div>
        )}
        {(!showFirstTimeTestingSection || errorMessage) && (
          <>
            {showSampleDataViewer && (
              <TestSampleDataViewer
                onRetest={fireTest}
                hideCancel={true}
                isValid={isValid}
                consoleLogs={null}
                isTesting={isPollingTesting}
                sampleData={sampleData}
                sampleDataInput={sampleDataInput ?? null}
                errorMessage={errorMessage ?? null}
                lastTestDate={lastTestDate}
                isSaving={isSaving}
                explanationContext={explanationContext}
                pieceDisplayName={pieceModel?.displayName}
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
      </div>
    );
  },
);
TestTriggerSection.displayName = 'TestTriggerSection';

const findTriggerLastTestDate = (
  trigger: FlowTrigger,
  stepName: string,
): string | undefined => {
  const step = flowStructureUtil.getStep(stepName, trigger);
  return step?.settings?.sampleData?.lastTestDate;
};

export { TestTriggerSection };
