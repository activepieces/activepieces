import {
  BranchEdge,
  FlowActionKind,
  FlowNodeData,
  FlowOperationType,
  FlowTriggerKind,
  flowStructureUtil,
  isNil,
} from '@activepieces/shared';
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
import { Separator } from '@/components/ui/separator';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { projectCollectionUtils } from '@/hooks/project-collection';
import { cn, GAP_SIZE_FOR_STEP_SETTINGS } from '@/lib/utils';

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
  const { stepName, selectedStep, pieceModel, formSchema } = useStepSettingsContext();
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

  const branchEdges =
    selectedStep.kind === FlowActionKind.ROUTER
      ? flowStructureUtil.getBranchEdges(flowVersion.graph, stepName)
      : [];
  const formDefaultValues = buildFormDefaultValues(selectedStep, branchEdges);
  const currentValuesRef = useRef<RouterFormData>(formDefaultValues);
  const form = useForm<RouterFormData>({
    mode: 'all',
    disabled: readonly,
    reValidateMode: 'onChange',
    defaultValues: formDefaultValues,
    resetOptions: {
      keepDefaultValues: false,
      keepDirtyValues: true,
    },
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
        cleanedNewValues.kind === FlowTriggerKind.EMPTY ||
        (isNil(pieceModel) &&
          (cleanedNewValues.kind === FlowActionKind.PIECE ||
            cleanedNewValues.kind === FlowTriggerKind.PIECE))
      ) {
        return result;
      }
      if (deepEqual(cleanedNewValues, cleanedCurrentValues)) {
        return result;
      }
      const valid = Object.keys(result.errors).length === 0;
      //We need to copy the object because the form is using the same object reference
      currentValuesRef.current = JSON.parse(JSON.stringify(cleanedNewValues));

      // Handle branch updates separately for routers
      if (cleanedNewValues.kind === FlowActionKind.ROUTER) {
        const routerFormData = cleanedNewValues as unknown as RouterFormData;
        const branches = routerFormData.branches;
        const oldBranches =
          'branches' in cleanedCurrentValues
            ? (cleanedCurrentValues as unknown as RouterFormData).branches
            : [];
        if (branches && !deepEqual(branches, oldBranches)) {
          for (let i = 0; i < branches.length; i++) {
            if (!deepEqual(branches[i], oldBranches?.[i])) {
              applyOperation({
                type: FlowOperationType.UPDATE_BRANCH,
                request: {
                  stepName,
                  branchIndex: i,
                  branchName: branches[i].branchName,
                  conditions: branches[i].conditions,
                },
              });
            }
          }
        }
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            id: stepName,
            action: {
              ...cleanedNewValues,
              valid,
            },
          },
        });
      } else if (cleanedNewValues.kind === FlowTriggerKind.PIECE) {
        applyOperation({
          type: FlowOperationType.UPDATE_TRIGGER,
          request: {
            ...cleanedNewValues,
            id: stepName,
            valid,
          },
        });
      } else if (
        cleanedNewValues.kind === FlowActionKind.CODE ||
        cleanedNewValues.kind === FlowActionKind.PIECE ||
        cleanedNewValues.kind === FlowActionKind.LOOP_ON_ITEMS
      ) {
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: {
            id: stepName,
            action: {
              ...cleanedNewValues,
              valid,
            },
          },
        });
      }
      return result;
    },
  });

  const sidebarHeaderContainerRef = useRef<HTMLDivElement>(null);
  const modifiedStep = form.getValues();
  const isManualTrigger =
    modifiedStep.kind === FlowTriggerKind.PIECE &&
    pieceSelectorUtils.isManualTrigger({
      pieceName: modifiedStep.settings.pieceName,
      triggerName: modifiedStep.settings.triggerName ?? '',
    });
  const showGenerateSampleData = !readonly && !isManualTrigger;
  const showStepInputOutFromRun = !isNil(run) && !isManualTrigger;

  const [isEditingStepOrBranchName, setIsEditingStepOrBranchName] =
    useState(false);
  const showActionErrorHandlingForm =
    [FlowActionKind.CODE, FlowActionKind.PIECE].includes(
      modifiedStep.kind as FlowActionKind,
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
                !isNil(selectedBranchIndex) &&
                modifiedStep.kind === FlowActionKind.ROUTER &&
                'branches' in modifiedStep
                  ? (modifiedStep as RouterFormData).branches?.[
                      selectedBranchIndex
                    ]?.branchName
                  : undefined
              }
              setBranchName={(value) => {
                if (!isNil(selectedBranchIndex)) {
                  form.setValue(
                    `branches.${selectedBranchIndex}.branchName`,
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
          <Separator className="w-full h-px" />
        </div>

        <DynamicPropertiesProvider
          key={`${stepName}-${selectedStep.kind}`}
        >
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel className="min-h-[80px]">
              <ScrollArea className="h-full">
                <div className="w-full my-2 px-3">
                  {stepMetadata && <StepInfo step={selectedStep} />}
                </div>
                <div
                  className={cn(
                    'flex flex-col px-4 pb-6',
                    GAP_SIZE_FOR_STEP_SETTINGS,
                  )}
                >
                  {modifiedStep.kind === FlowActionKind.LOOP_ON_ITEMS && (
                    <LoopsSettings readonly={readonly}></LoopsSettings>
                  )}
                  {modifiedStep.kind === FlowActionKind.CODE && (
                    <CodeSettings readonly={readonly}></CodeSettings>
                  )}
                  {modifiedStep.kind === FlowActionKind.PIECE &&
                    runAgentStep &&
                    modifiedStep && (
                      <AgentSettings
                        step={modifiedStep}
                        flowId={flowVersion.flowId}
                        readonly={readonly}
                      />
                    )}
                  {modifiedStep.kind === FlowActionKind.PIECE &&
                    !runAgentStep &&
                    modifiedStep && (
                      <PieceSettings
                        step={modifiedStep}
                        flowId={flowVersion.flowId}
                        readonly={readonly}
                      ></PieceSettings>
                    )}
                  {modifiedStep.kind === FlowActionKind.ROUTER &&
                    modifiedStep && (
                      <RouterSettings readonly={readonly}></RouterSettings>
                    )}
                  {modifiedStep.kind === FlowTriggerKind.PIECE &&
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
                        stepMetadata.type === FlowActionKind.PIECE
                          ? stepMetadata.errorHandlingOptions?.continueOnFailure
                              ?.hide
                          : false
                      }
                      disabled={readonly}
                      hideRetryOnFailure={
                        stepMetadata.type === FlowActionKind.PIECE
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
                  <ScrollArea
                    className="h-[calc(100%-35px)]"
                    viewPortClassName="h-full"
                  >
                    {showGenerateSampleData && (
                      <TestStepContainer
                        type={modifiedStep.kind}
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

export type BranchFormItem = Pick<
  BranchEdge,
  'branchName' | 'branchType' | 'conditions'
>;

export type RouterFormData = FlowNodeData & {
  branches?: BranchFormItem[];
};

function buildFormDefaultValues(
  selectedStep: FlowNodeData,
  branchEdges: BranchEdge[],
): RouterFormData {
  if (selectedStep.kind !== FlowActionKind.ROUTER) {
    return selectedStep;
  }
  return {
    ...selectedStep,
    branches: branchEdges.map((edge) => ({
      branchName: edge.branchName,
      branchType: edge.branchType,
      conditions: edge.conditions,
    })),
  };
}
