import {
  FlowAction,
  FlowActionType,
  FlowOperationType,
  FlowTrigger,
  FlowTriggerType,
  isNil,
} from '@activepieces/shared';
import { zodResolver } from '@hookform/resolvers/zod';
import deepEqual from 'deep-equal';
import { useEffect, useRef, useState } from 'react';
import { useForm, Resolver } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Form } from '@/components/ui/form';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import {
  stepsHooks,
  pieceSelectorUtils,
  formUtils,
  PieceIcon,
  PieceStepMetadata,
} from '@/features/pieces';
import { projectCollectionUtils } from '@/features/projects';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

import { ActionErrorHandlingForm } from '../piece-properties/action-error-handling';
import { DynamicPropertiesProvider } from '../piece-properties/dynamic-properties-context';
import { SidebarHeader } from '../sidebar-header';
import { TestPanelHost } from '../test-step/test-panel-host';
import { TestStepCTAButton } from '../test-step/test-step-cta-button';

import { AgentSettings } from './agent-settings';
import { CodeSettings } from './code-settings';
import EditableStepName from './editable-step-name';
import { LoopsSettings } from './loops-settings';
import { PieceSettings } from './piece-settings';
import { RouterSettings } from './router-settings';
import { SettingsSubHeader } from './settings-sub-header';
import { StepNavigationButtons } from './step-navigation-buttons';
import { useStepSettingsContext } from './step-settings-context';

const StepSettingsContainer = () => {
  const { selectedStep, pieceModel, formSchema } = useStepSettingsContext();
  const { project } = projectCollectionUtils.useCurrentProject();
  const [
    readonly,
    exitStepSettings,
    applyOperation,
    saving,
    flowVersion,
    selectedBranchIndex,
    setSelectedBranchIndex,
    run,
    testPanelView,
    isTestPanelOpen,
  ] = useBuilderStateContext((state) => [
    state.readonly,
    state.exitStepSettings,
    state.applyOperation,
    state.saving,
    state.flowVersion,
    state.selectedBranchIndex,
    state.setSelectedBranchIndex,
    state.run,
    state.testPanelView,
    state.isTestPanelOpen,
  ]);

  const { stepMetadata } = stepsHooks.useStepMetadata({
    step: selectedStep,
  });

  const selectedStepRef = useRef(selectedStep);
  selectedStepRef.current = selectedStep;

  const currentValuesRef = useRef<FlowAction | FlowTrigger>(selectedStep);
  const form = useForm<FlowAction | FlowTrigger>({
    mode: 'all',
    disabled: readonly,
    reValidateMode: 'onChange',
    defaultValues: selectedStep,
    resetOptions: {
      keepDefaultValues: false,
      keepDirtyValues: true,
    },
    resolver: async (values, context, options) => {
      const result = await (
        zodResolver(formSchema) as unknown as Resolver<FlowAction | FlowTrigger>
      )(values, context, options);

      const cleanedNewValues = formUtils.removeUndefinedFromInput(values);
      const cleanedCurrentValues = formUtils.removeUndefinedFromInput(
        currentValuesRef.current,
      );
      const valid = Object.keys(result.errors).length === 0;
      cleanedNewValues.valid = valid;
      if (
        cleanedNewValues.type === FlowTriggerType.EMPTY ||
        (isNil(pieceModel) &&
          (cleanedNewValues.type === FlowActionType.PIECE ||
            cleanedNewValues.type === FlowTriggerType.PIECE))
      ) {
        return result;
      }
      if (
        deepEqual(
          stripSampleData(cleanedNewValues),
          stripSampleData(cleanedCurrentValues),
        )
      ) {
        return result;
      }
      //We need to copy the object because the form is using the same object reference
      currentValuesRef.current = JSON.parse(JSON.stringify(cleanedNewValues));
      if (cleanedNewValues.type === FlowTriggerType.PIECE) {
        applyOperation({
          type: FlowOperationType.UPDATE_TRIGGER,
          request: {
            ...cleanedNewValues,
            valid,
          },
        });
      } else {
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            ...cleanedNewValues,
            valid,
          },
        });
      }
      return result;
    },
  });

  const sidebarHeaderContainerRef = useRef<HTMLDivElement>(null);
  const modifiedStep = form.getValues();
  const isManualTrigger =
    modifiedStep.type === FlowTriggerType.PIECE &&
    pieceSelectorUtils.isManualTrigger({
      pieceName: modifiedStep.settings.pieceName,
      triggerName: modifiedStep.settings.triggerName ?? '',
    });
  const showGenerateSampleData = !readonly && !isManualTrigger;
  const showStepInputOutFromRun = !isNil(run) && !isManualTrigger;

  const [isEditingStepOrBranchName, setIsEditingStepOrBranchName] =
    useState(false);
  const showActionErrorHandlingForm =
    [FlowActionType.CODE, FlowActionType.PIECE].includes(
      modifiedStep.type as FlowActionType,
    ) && !isNil(stepMetadata);

  const runAgentStep =
    modifiedStep.settings.pieceName === '@activepieces/piece-ai' &&
    modifiedStep.settings.actionName === 'run_agent';

  useEffect(() => {
    //RHF doesn't automatically trigger validation when the form is rendered, so we need to trigger it manually
    form.trigger();
  }, []);

  const showTestPanel = showGenerateSampleData || showStepInputOutFromRun;

  const settingsForm = (
    <ScrollArea className="h-full">
      <SettingsSubHeader step={selectedStep} />
      <div
        className={cn(
          'flex flex-col px-4 pb-6 pt-3',
          GAP_SIZE_FOR_STEP_SETTINGS,
        )}
      >
        {modifiedStep.type === FlowActionType.LOOP_ON_ITEMS && (
          <LoopsSettings readonly={readonly}></LoopsSettings>
        )}
        {modifiedStep.type === FlowActionType.CODE && (
          <CodeSettings readonly={readonly}></CodeSettings>
        )}
        {modifiedStep.type === FlowActionType.PIECE &&
          runAgentStep &&
          modifiedStep && (
            <AgentSettings
              step={modifiedStep}
              flowId={flowVersion.flowId}
              readonly={readonly}
            />
          )}
        {modifiedStep.type === FlowActionType.PIECE &&
          !runAgentStep &&
          modifiedStep && (
            <PieceSettings
              step={modifiedStep}
              flowId={flowVersion.flowId}
              readonly={readonly}
            ></PieceSettings>
          )}
        {modifiedStep.type === FlowActionType.ROUTER && modifiedStep && (
          <RouterSettings readonly={readonly}></RouterSettings>
        )}
        {modifiedStep.type === FlowTriggerType.PIECE && modifiedStep && (
          <PieceSettings
            step={modifiedStep}
            flowId={flowVersion.flowId}
            readonly={readonly}
          ></PieceSettings>
        )}
        {showActionErrorHandlingForm && (
          <ActionErrorHandlingForm
            hideContinueOnFailure={
              stepMetadata.type === FlowActionType.PIECE
                ? stepMetadata.errorHandlingOptions?.continueOnFailure?.hide
                : false
            }
            disabled={readonly}
            hideRetryOnFailure={
              stepMetadata.type === FlowActionType.PIECE
                ? stepMetadata.errorHandlingOptions?.retryOnFailure?.hide
                : false
            }
          ></ActionErrorHandlingForm>
        )}
      </div>
    </ScrollArea>
  );

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        onChange={(e) => e.preventDefault()}
        className="w-full h-full flex flex-col"
      >
        <div ref={sidebarHeaderContainerRef}>
          <SidebarHeader
            onClose={() => exitStepSettings()}
            leadingIcon={
              stepMetadata ? (
                <PieceIcon
                  logoUrl={stepMetadata.logoUrl}
                  displayName={stepMetadata.displayName}
                  showTooltip={false}
                  border={false}
                  size="md"
                />
              ) : null
            }
            actions={<StepNavigationButtons />}
          >
            <EditableStepName
              selectedBranchIndex={selectedBranchIndex}
              setDisplayName={(value) => {
                form.setValue('displayName', value, {
                  shouldValidate: true,
                });
              }}
              readonly={readonly}
              displayName={modifiedStep.displayName}
              branchName={
                !isNil(selectedBranchIndex)
                  ? modifiedStep.settings.branches?.[selectedBranchIndex]
                      ?.branchName
                  : undefined
              }
              setBranchName={(value) => {
                if (!isNil(selectedBranchIndex)) {
                  form.setValue(
                    `settings.branches[${selectedBranchIndex}].branchName`,
                    value,
                    {
                      shouldValidate: true,
                    },
                  );
                }
              }}
              setSelectedBranchIndex={setSelectedBranchIndex}
              isEditingStepOrBranchName={isEditingStepOrBranchName}
              setIsEditingStepOrBranchName={setIsEditingStepOrBranchName}
              tooltipTitle={
                stepMetadata?.actionOrTriggerOrAgentDisplayName ||
                stepMetadata?.displayName
              }
              tooltipDescription={
                stepMetadata?.actionOrTriggerOrAgentDescription ||
                stepMetadata?.description
              }
              pieceVersion={
                isPieceMetadata(stepMetadata)
                  ? stepMetadata.pieceVersion
                  : undefined
              }
            ></EditableStepName>
          </SidebarHeader>
          <Separator className="w-full h-px" />
        </div>

        <DynamicPropertiesProvider
          key={`${selectedStep.name}-${selectedStep.type}`}
        >
          {showTestPanel && isTestPanelOpen && testPanelView === 'split' ? (
            <ResizablePanelGroup
              orientation="horizontal"
              className="flex-1 min-h-0"
            >
              <ResizablePanel
                defaultSize="50%"
                minSize="40%"
                className="min-w-0"
              >
                {settingsForm}
              </ResizablePanel>
              <ResizableHandle withHandle />
              <ResizablePanel
                defaultSize="50%"
                minSize="40%"
                className="min-w-0"
              >
                <TestPanelHost
                  mode="split"
                  flowId={flowVersion.flowId}
                  flowVersionId={flowVersion.id}
                  projectId={project?.id}
                  stepType={modifiedStep.type}
                  showGenerateSampleData={showGenerateSampleData}
                  showStepInputOutFromRun={showStepInputOutFromRun}
                  saving={saving}
                />
              </ResizablePanel>
            </ResizablePanelGroup>
          ) : (
            <div className="relative flex-1 min-h-0 flex flex-col">
              <div className="flex-1 min-h-0">{settingsForm}</div>
              {showTestPanel && !isTestPanelOpen && <TestStepCTAButton />}
              {showTestPanel && isTestPanelOpen && (
                <TestPanelHost
                  mode="drawer"
                  flowId={flowVersion.flowId}
                  flowVersionId={flowVersion.id}
                  projectId={project?.id}
                  stepType={modifiedStep.type}
                  showGenerateSampleData={showGenerateSampleData}
                  showStepInputOutFromRun={showStepInputOutFromRun}
                  saving={saving}
                />
              )}
            </div>
          )}
        </DynamicPropertiesProvider>
      </form>
    </Form>
  );
};
StepSettingsContainer.displayName = 'StepSettingsContainer';
export { StepSettingsContainer };
const stripSampleData = (step: FlowAction | FlowTrigger) => {
  const { sampleData: _, ...settingsWithoutSampleData } = step.settings;
  const { lastUpdatedDate: __, ...stepWithoutMetadata } = step;

  return { ...stepWithoutMetadata, settings: settingsWithoutSampleData };
};

const isPieceMetadata = (
  metadata: { type: FlowActionType | FlowTriggerType } | undefined,
): metadata is PieceStepMetadata =>
  metadata?.type === FlowActionType.PIECE ||
  metadata?.type === FlowTriggerType.PIECE;
