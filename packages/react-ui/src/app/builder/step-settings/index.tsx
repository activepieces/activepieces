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
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { projectHooks } from '@/hooks/project-hooks';
import {
  Action,
  ActionType,
  FlowOperationType,
  Trigger,
  TriggerType,
  debounce,
  isNil,
} from '@activepieces/shared';

import { PieceCardInfo } from '../../../features/pieces/components/piece-card';
import { ActionErrorHandlingForm } from '../piece-properties/action-error-handling';
import { formUtils } from '../piece-properties/form-utils';
import { SidebarHeader } from '../sidebar-header';
import { TestStepContainer } from '../test-step';

import { CodeSettings } from './code-settings';
import EditableStepName from './editable-step-name';
import { LoopsSettings } from './loops-settings';
import { PieceSettings } from './piece-settings';
import { RouterSettings } from './router-settings';
import { useStepSettingsContext } from './step-settings-context';

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
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshStepFormSettingsToggle]);

  const { stepMetadata } = piecesHooks.useStepMetadata({
    step: selectedStep,
  });

  const debouncedTrigger = useMemo(() => {
    return debounce((newTrigger: Trigger) => {
      applyOperation({
        type: FlowOperationType.UPDATE_TRIGGER,
        request: newTrigger,
      });
    }, 200);
  }, [applyOperation]);

  const debouncedAction = useMemo(() => {
    return debounce((newAction: Action) => {
      applyOperation({
        type: FlowOperationType.UPDATE_ACTION,
        request: newAction,
      });
    }, 200);
  }, [applyOperation]);
  const currentValuesRef = useRef<Action | Trigger>(defaultValues);
  const form = useForm<Action | Trigger>({
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
      if (values.type === TriggerType.EMPTY) {
        return result;
      }
      if (deepEqual(values, currentValuesRef.current)) {
        return result;
      }
      const valid = Object.keys(result.errors).length === 0;

      currentValuesRef.current = JSON.parse(JSON.stringify(values));
      if (values.type === TriggerType.PIECE) {
        debouncedTrigger({ ...values, valid });
      } else {
        debouncedAction({ ...values, valid });
      }

      return result;
    },
  });

  const actionOrTriggerDisplayName = selectedStep.settings.actionName
    ? pieceModel?.actions[selectedStep.settings.actionName]?.displayName
    : selectedStep.settings.triggerName
    ? pieceModel?.triggers[selectedStep.settings.triggerName]?.displayName
    : null;

  const sidebarHeaderContainerRef = useRef<HTMLDivElement>(null);
  const modifiedStep = form.getValues();
  const [isEditingStepOrBranchName, setIsEditingStepOrBranchName] =
    useState(false);
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

        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={55}>
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-4 px-4 pb-6">
                {stepMetadata && (
                  <PieceCardInfo
                    piece={stepMetadata}
                    customizedInputs={
                      selectedStep.settings?.inputUiInfo?.customizedInputs
                    }
                    actionOrTriggerDisplayName={actionOrTriggerDisplayName}
                  ></PieceCardInfo>
                )}
                {modifiedStep.type === ActionType.LOOP_ON_ITEMS && (
                  <LoopsSettings readonly={readonly}></LoopsSettings>
                )}
                {modifiedStep.type === ActionType.CODE && (
                  <CodeSettings readonly={readonly}></CodeSettings>
                )}
                {modifiedStep.type === ActionType.PIECE && modifiedStep && (
                  <PieceSettings
                    step={modifiedStep}
                    flowId={flowVersion.flowId}
                    readonly={readonly}
                  ></PieceSettings>
                )}
                {modifiedStep.type === ActionType.ROUTER && modifiedStep && (
                  <RouterSettings readonly={readonly}></RouterSettings>
                )}
                {modifiedStep.type === TriggerType.PIECE && modifiedStep && (
                  <PieceSettings
                    step={modifiedStep}
                    flowId={flowVersion.flowId}
                    readonly={readonly}
                  ></PieceSettings>
                )}
                {[ActionType.CODE, ActionType.PIECE].includes(
                  modifiedStep.type as ActionType,
                ) && (
                  <ActionErrorHandlingForm
                    hideContinueOnFailure={
                      stepMetadata?.type === ActionType.PIECE
                        ? stepMetadata?.errorHandlingOptions?.continueOnFailure
                            ?.hide
                        : false
                    }
                    disabled={readonly}
                    hideRetryOnFailure={
                      stepMetadata?.type === ActionType.PIECE
                        ? stepMetadata?.errorHandlingOptions?.retryOnFailure
                            ?.hide
                        : false
                    }
                  ></ActionErrorHandlingForm>
                )}
              </div>
            </ScrollArea>
          </ResizablePanel>
          {!readonly && (
            <>
              <ResizableHandle withHandle={true} />
              <ResizablePanel defaultSize={45}>
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
      </form>
    </Form>
  );
};
StepSettingsContainer.displayName = 'StepSettingsContainer';
export { StepSettingsContainer };
