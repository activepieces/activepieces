import { typeboxResolver } from '@hookform/resolvers/typebox';
import deepEqual from 'deep-equal';
import { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Form } from '@/components/ui/form';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import {
  FlowAction,
  FlowActionType,
  FlowOperationType,
  FlowTrigger,
  FlowTriggerType,
  isNil,
} from '@activepieces/shared';

import { formUtils } from '../../../features/pieces/lib/form-utils';
import { ActionErrorHandlingForm } from '../piece-properties/action-error-handling';
import { DynamicPropertiesProvider } from '../piece-properties/dynamic-properties-context';
import { FlowStepInputOutput } from '../run-details/flow-step-input-output';
import { SidebarHeader } from '../sidebar-header';
import { TestStepContainer } from '../test-step';

import { AgentSettings } from './agent-settings';
import { CodeSettings } from './code-settings';
import EditableStepName from './editable-step-name';
import { LoopsSettings } from './loops-settings';
import { PieceSettings } from './piece-settings';
import { useResizableVerticalPanelsContext } from './resizable-vertical-panels-context';
import { RouterSettings } from './router-settings';
import { StepInfo } from './step-info';
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
  ] = useBuilderStateContext((state) => [
    state.readonly,
    state.exitStepSettings,
    state.applyOperation,
    state.saving,
    state.flowVersion,
    state.selectedBranchIndex,
    state.setSelectedBranchIndex,
    state.run,
  ]);

  const { stepMetadata } = stepsHooks.useStepMetadata({
    step: selectedStep,
  });

  const currentValuesRef = useRef<FlowAction | FlowTrigger>(selectedStep);
  const form = useForm<FlowAction | FlowTrigger>({
    mode: 'all',
    disabled: readonly,
    reValidateMode: 'onChange',
    defaultValues: selectedStep,
    resolver: async (values, context, options) => {
      const result = await typeboxResolver(formSchema)(
        values,
        context,
        options,
      );

      const cleanedNewValues = formUtils.removeUndefinedFromInput(values);
      const cleanedCurrentValues = formUtils.removeUndefinedFromInput(
        currentValuesRef.current,
      );
      if (
        cleanedNewValues.type === FlowTriggerType.EMPTY ||
        (isNil(pieceModel) &&
          (cleanedNewValues.type === FlowActionType.PIECE ||
            cleanedNewValues.type === FlowTriggerType.PIECE))
      ) {
        return result;
      }
      if (deepEqual(cleanedNewValues, cleanedCurrentValues)) {
        return result;
      }
      const valid = Object.keys(result.errors).length === 0;
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
  const showGenerateSampleData = !readonly;
  const showStepInputOutFromRun = !isNil(run);

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

  const { height, setHeight } = useResizableVerticalPanelsContext();

  return (
    <Form {...form}>
      <form
        onSubmit={(e) => e.preventDefault()}
        onChange={(e) => e.preventDefault()}
        className="w-full h-full"
      >
        <div ref={sidebarHeaderContainerRef}>
          <SidebarHeader onClose={() => exitStepSettings()}>
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
            ></EditableStepName>
          </SidebarHeader>
        </div>
        <DynamicPropertiesProvider
          key={`${selectedStep.name}-${selectedStep.type}`}
        >
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="min-h-[80px]">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-2 px-4 pb-6">
                  <StepInfo step={modifiedStep}></StepInfo>

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
                  {modifiedStep.type === FlowActionType.ROUTER &&
                    modifiedStep && (
                      <RouterSettings readonly={readonly}></RouterSettings>
                    )}
                  {modifiedStep.type === FlowTriggerType.PIECE &&
                    modifiedStep && (
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
                          ? stepMetadata.errorHandlingOptions?.continueOnFailure
                              ?.hide
                          : false
                      }
                      disabled={readonly}
                      hideRetryOnFailure={
                        stepMetadata.type === FlowActionType.PIECE
                          ? stepMetadata.errorHandlingOptions?.retryOnFailure
                              ?.hide
                          : false
                      }
                    ></ActionErrorHandlingForm>
                  )}
                </div>
              </ScrollArea>
            </ResizablePanel>

            {(showGenerateSampleData || showStepInputOutFromRun) && (
              <>
                <ResizableHandle withHandle={true} />
                <ResizablePanel
                  defaultSize={height}
                  onResize={(size) => setHeight(size)}
                  className="min-h-[130px]"
                >
                  <ScrollArea className="h-[calc(100%-35px)]  ">
                    {showGenerateSampleData && (
                      <TestStepContainer
                        type={modifiedStep.type}
                        flowId={flowVersion.flowId}
                        flowVersionId={flowVersion.id}
                        projectId={project?.id}
                        isSaving={saving}
                      ></TestStepContainer>
                    )}
                    {showStepInputOutFromRun && (
                      <FlowStepInputOutput></FlowStepInputOutput>
                    )}
                  </ScrollArea>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </DynamicPropertiesProvider>
      </form>
    </Form>
  );
};
StepSettingsContainer.displayName = 'StepSettingsContainer';
export { StepSettingsContainer };
