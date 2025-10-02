import { typeboxResolver } from '@hookform/resolvers/typebox';
import deepEqual from 'deep-equal';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import { Form } from '@/components/ui/form';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { stepsHooks } from '@/features/pieces/lib/steps-hooks';
import { projectHooks } from '@/hooks/project-hooks';
import {
  FlowAction,
  FlowActionType,
  FlowOperationType,
  FlowTrigger,
  FlowTriggerType,
  PieceActionSettings,
  PieceTriggerSettings,
  debounce,
  isNil,
} from '@activepieces/shared';

import { formUtils } from '../../../features/pieces/lib/form-utils';
import { ActionErrorHandlingForm } from '../piece-properties/action-error-handling';
import { DynamicPropertiesProvider } from '../piece-properties/dynamic-properties-context';
import { SidebarHeader } from '../sidebar-header';
import { TestStepContainer } from '../test-step';

import { CodeSettings } from './code-settings';
import EditableStepName from './editable-step-name';
import { LoopsSettings } from './loops-settings';
import { PieceSettings } from './piece-settings';
import { RouterSettings } from './router-settings';
import { StepCard } from './step-card';
import { useStepSettingsContext } from './step-settings-context';
import { Separator } from '@/components/ui/separator';
import { ConnectionSelect } from './piece-settings/connection-select';
import { AutoFieldsAccordion } from '../piece-properties/auto-fields-accordion';

const StepSettingsContainer = () => {
  const { selectedStep, pieceModel, formSchema } = useStepSettingsContext();
  const { project } = projectHooks.useCurrentProject();
  const [
    readonly,
    exitStepSettings,
    applyOperation,
    saving,
    flowVersion,
    selectedBranchIndex,
    setSelectedBranchIndex,
    refreshStepFormSettingsToggle,
  ] = useBuilderStateContext((state) => [
    state.readonly,
    state.exitStepSettings,
    state.applyOperation,
    state.saving,
    state.flowVersion,
    state.selectedBranchIndex,
    state.setSelectedBranchIndex,
    state.refreshStepFormSettingsToggle,
  ]);

  const defaultValues = useMemo(() => {
    return formUtils.buildPieceDefaultValue(selectedStep, pieceModel, true);
  }, [selectedStep.name, pieceModel]);

  useEffect(() => {
    currentValuesRef.current = defaultValues;
    form.reset(defaultValues);
    form.trigger();
  }, [defaultValues]);

  //Needed to show new code from Ask AI
  useEffect(() => {
    form.reset(selectedStep);
    form.trigger();
  }, [refreshStepFormSettingsToggle]);

  const { stepMetadata } = stepsHooks.useStepMetadata({
    step: selectedStep,
  });

  const currentValuesRef = useRef<FlowAction | FlowTrigger>(defaultValues);
  const form = useForm<FlowAction | FlowTrigger>({
    mode: 'all',
    disabled: readonly,
    reValidateMode: 'onChange',
    defaultValues,
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
          request: { ...cleanedNewValues, valid },
        });
      } else {
        applyOperation({
          type: FlowOperationType.UPDATE_ACTION,
          request: { ...cleanedNewValues, valid },
        });
      }
      return result;
    },
  });

  const sidebarHeaderContainerRef = useRef<HTMLDivElement>(null);
  const modifiedStep = form.getValues();
  
  const actionName = (modifiedStep.settings as PieceActionSettings).actionName;
  const selectedAction = actionName
    ? pieceModel?.actions[actionName]
    : undefined;
  const triggerName = (modifiedStep.settings as PieceTriggerSettings).triggerName;
  const selectedTrigger = triggerName
    ? pieceModel?.triggers[triggerName]
    : undefined;

  const showAuthForAction =
    !isNil(selectedAction) && (selectedAction.requireAuth ?? true);
  const showAuthForTrigger =
    !isNil(selectedTrigger) && (selectedTrigger.requireAuth ?? true);
  
  const [isEditingStepOrBranchName, setIsEditingStepOrBranchName] =
    useState(false);
  const showActionErrorHandlingForm =
    [FlowActionType.CODE, FlowActionType.PIECE].includes(
      modifiedStep.type as FlowActionType,
    ) && !isNil(stepMetadata);

  const actionPropsWithoutAuth = selectedAction ? (() => {
    const { auth, ...rest } = selectedAction.props ?? {};
    return rest;
  })() : {};
  
  const triggerPropsWithoutAuth = selectedTrigger ? (() => {
    const { auth, ...rest } = selectedTrigger.props ?? {};
    return rest;
  })() : {};

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
            <ResizablePanel defaultSize={55} className="min-h-[80px]">
              <ScrollArea className="h-full">
                <div className="flex flex-col gap-4 px-4 pb-6">
                  <StepCard step={modifiedStep}></StepCard>

                  {pieceModel?.auth && (showAuthForAction || showAuthForTrigger) && (
                    <ConnectionSelect
                      isTrigger={!isNil(selectedTrigger)}
                      piece={pieceModel}
                      disabled={readonly}
                    ></ConnectionSelect>
                  )}
                  
                  <Accordion type="single" collapsible defaultValue="settings" className="border-0">
                    <AccordionItem value="settings">
                    <Separator />

                      <AccordionTrigger className="px-0 text-md">Settings</AccordionTrigger>
                      <AccordionContent className="px-0 py-1">

                        <div className='flex flex-col gap-6'>
                          {modifiedStep.type === FlowActionType.LOOP_ON_ITEMS && (
                            <LoopsSettings readonly={readonly}></LoopsSettings>
                          )}
                          {modifiedStep.type === FlowActionType.CODE && (
                            <CodeSettings readonly={readonly}></CodeSettings>
                          )}
                          {modifiedStep.type === FlowActionType.PIECE &&
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
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                  <AutoFieldsAccordion
                  props={selectedAction ? actionPropsWithoutAuth : triggerPropsWithoutAuth}
                  prefixValue="settings.input"
                  disabled={readonly}
                />
                </div>
              </ScrollArea>
            </ResizablePanel>
            {!readonly && (
              <>
                <ResizableHandle withHandle={true} style={{ zIndex: 100 }}/>
                <ResizablePanel defaultSize={45} className="min-h-[130px]">
                  <ScrollArea className="h-[calc(100%-35px)] p-4 pb-10 ">
                    {modifiedStep.type && (
                      <TestStepContainer
                        type={modifiedStep.type}
                        flowId={flowVersion.flowId}
                        flowVersionId={flowVersion.id}
                        projectId={project?.id}
                        isSaving={saving}
                      ></TestStepContainer>
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
