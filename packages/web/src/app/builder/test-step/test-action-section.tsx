import {
  FlowAction,
  FlowActionType,
  Step,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
import { t } from 'i18next';
import { FlaskConical, Play } from 'lucide-react';
import React, { useContext } from 'react';

import { Button } from '@/components/ui/button';
import { piecesHooks } from '@/features/pieces';

import { useBuilderStateContext } from '../builder-hooks';
import { stepPropertiesSnapshotUtils } from '../data-display/build-step-properties-snapshot';
import { ErrorExplanationContext } from '../data-display/explanation-prompt';
import { DynamicPropertiesContext } from '../piece-properties/dynamic-properties-context';

import { TestPanelHeader } from './test-panel-header';
import { TestPanelViewToggle } from './test-panel-view-toggle';
import { useActionTestRunner } from './test-runner-context';
import { TestSampleDataViewer } from './test-sample-data-viewer';
import { TestButtonTooltip } from './test-step-tooltip';

const TestStepSectionImplementation = React.memo(
  ({
    isSaving,
    currentStep,
  }: TestActionComponentProps & { currentStep: FlowAction }) => {
    const [
      sampleData,
      sampleDataInput,
      errorMessage,
      consoleLogs,
      isStepBeingTested,
      removeStepTestListener,
      revertSampleDataLocally,
    ] = useBuilderStateContext((state) => {
      return [
        state.outputSampleData[currentStep.name],
        state.inputSampleData[currentStep.name],
        state.errorLogs[currentStep.name],
        currentStep.type === FlowActionType.CODE
          ? state.consoleLogs[currentStep.name]
          : null,
        state.isStepBeingTested,
        state.removeStepTestListener,
        state.revertSampleDataLocallyCallbacks[currentStep.name],
      ];
    });

    const runner = useActionTestRunner();
    const onTestButtonClick = () => runner?.fireTest();

    const lastTestDate = currentStep.settings.sampleData?.lastTestDate;

    const sampleDataExists =
      !isNil(lastTestDate) ||
      !isNil(errorMessage) ||
      isStepBeingTested(currentStep.name);

    const isTesting = runner?.isTesting ?? false;
    const { isLoadingDynamicProperties } = useContext(DynamicPropertiesContext);

    const pieceName =
      currentStep.type === FlowActionType.PIECE
        ? currentStep.settings.pieceName
        : undefined;
    const pieceVersion =
      currentStep.type === FlowActionType.PIECE
        ? currentStep.settings.pieceVersion
        : undefined;
    const { pieceModel } = piecesHooks.usePiece({
      name: pieceName ?? '',
      version: pieceVersion,
      enabled: !isNil(pieceName),
    });
    const stepKind = 'action';
    const stepName =
      currentStep.type === FlowActionType.PIECE
        ? currentStep.settings.actionName
        : currentStep.type;
    const stepInput =
      currentStep.type === FlowActionType.PIECE
        ? (currentStep.settings.input as Record<string, unknown> | undefined)
        : undefined;
    const explanationContext: ErrorExplanationContext = {
      pieceName,
      pieceVersion,
      pieceDisplayName: pieceModel?.displayName,
      pieceAuthType: stepPropertiesSnapshotUtils.findAuthType(pieceModel),
      stepKind,
      stepName,
      stepDisplayName: currentStep.displayName,
      stepDescription: stepPropertiesSnapshotUtils.findDescription({
        pieceModel,
        stepKind,
        stepName,
      }),
      stepProperties: stepPropertiesSnapshotUtils.build({
        pieceModel,
        stepKind,
        stepName,
        input: stepInput,
      }),
    };

    return (
      <>
        {!sampleDataExists && !isTesting && (
          <div className="flex flex-col h-full">
            <TestPanelHeader status="idle" />
            <div className="flex justify-end px-3 py-2 shrink-0">
              <TestPanelViewToggle />
            </div>
            <div className="grow flex flex-col items-center justify-center w-full px-6 py-10 gap-4 text-center">
              <div className="flex items-center justify-center size-12 rounded-full bg-primary/10 text-primary">
                <FlaskConical className="size-6" />
              </div>
              <div className="flex flex-col gap-1.5 max-w-[280px]">
                <span className="text-sm font-medium text-foreground">
                  {t('No sample data yet')}
                </span>
                <span className="text-xs text-muted-foreground leading-relaxed">
                  {t(
                    'Run this step to capture sample data. You can then use the result in following steps.',
                  )}
                </span>
              </div>
              <TestButtonTooltip saving={isSaving} invalid={!currentStep.valid}>
                <Button
                  size="sm"
                  onClick={onTestButtonClick}
                  loading={isTesting || isSaving}
                  disabled={!currentStep.valid || isLoadingDynamicProperties}
                  className="bg-primary text-primary-foreground hover:bg-primary/90"
                >
                  <Play className="size-3.5 fill-current" />
                  {t('Test Step')}
                </Button>
              </TestButtonTooltip>
            </div>
          </div>
        )}
        {(sampleDataExists || isTesting) && (
          <TestSampleDataViewer
            isValid={currentStep.valid && !isLoadingDynamicProperties}
            currentStep={currentStep}
            isTesting={isTesting}
            sampleData={sampleData}
            sampleDataInput={sampleDataInput ?? null}
            lastTestDate={lastTestDate}
            isSaving={isSaving}
            onRetest={onTestButtonClick}
            errorMessage={errorMessage}
            consoleLogs={consoleLogs}
            explanationContext={explanationContext}
            pieceDisplayName={pieceModel?.displayName}
            onCancelTesting={() => {
              removeStepTestListener(currentStep.name);
              revertSampleDataLocally?.();
            }}
          ></TestSampleDataViewer>
        )}
      </>
    );
  },
);

const isAction = (step: Step): step is FlowAction => {
  return flowStructureUtil.isAction(step.type);
};
const TestActionSection = React.memo((props: TestActionComponentProps) => {
  const currentStep = useBuilderStateContext((state) =>
    state.selectedStep
      ? flowStructureUtil.getStep(state.selectedStep, state.flowVersion.trigger)
      : null,
  );
  if (isNil(currentStep) || !isAction(currentStep)) {
    return null;
  }

  return <TestStepSectionImplementation {...props} currentStep={currentStep} />;
});

TestStepSectionImplementation.displayName = 'TestStepSectionImplementation';
TestActionSection.displayName = 'TestActionSection';

type TestActionComponentProps = {
  isSaving: boolean;
  flowVersionId: string;
  projectId: string;
};

export { TestActionSection };
