import { typeboxResolver } from '@hookform/resolvers/typebox';
import deepEqual from 'deep-equal';
import { t } from 'i18next';
import { Pencil } from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useDeepCompareEffect } from 'react-use';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
import EditableText from '@/components/ui/editable-text';
import { Form } from '@/components/ui/form';
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from '@/components/ui/resizable-panel';
import { ScrollArea } from '@/components/ui/scroll-area';
import { UNSAVED_CHANGES_TOAST, useToast } from '@/components/ui/use-toast';
import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
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
import { LoopsSettings } from './loops-settings';
import { PieceSettings } from './piece-settings';
import { RouterSettings } from './router-settings';
import { useStepSettingsContext } from './step-settings-context';

const StepSettingsContainer = () => {
  const { selectedStep, pieceModel, formSchema } = useStepSettingsContext();
  const [
    readonly,
    exitStepSettings,
    applyOperation,
    saving,
    flowVersion,
    refreshPieceFormSettings,
    selectedBranchIndex,
    setSelectedBranchIndex,
  ] = useBuilderStateContext((state) => [
    state.readonly,
    state.exitStepSettings,
    state.applyOperation,
    state.saving,
    state.flowVersion,
    state.refreshPieceFormSettings,
    state.selectedBranchIndex,
    state.setSelectedBranchIndex,
  ]);

  const defaultValues = useMemo(() => {
    return formUtils.buildPieceDefaultValue(selectedStep, pieceModel, true);
  }, [selectedStep, pieceModel]);

  const { stepMetadata } = piecesHooks.useStepMetadata({
    step: selectedStep,
  });

  const { toast } = useToast();

  const debouncedTrigger = useMemo(() => {
    return debounce((newTrigger: Trigger) => {
      applyOperation(
        {
          type: FlowOperationType.UPDATE_TRIGGER,
          request: newTrigger,
        },
        () => toast(UNSAVED_CHANGES_TOAST),
      );
    }, 200);
  }, [applyOperation]);

  const debouncedAction = useMemo(() => {
    return debounce((newAction: Action) => {
      applyOperation(
        {
          type: FlowOperationType.UPDATE_ACTION,
          request: newAction,
        },
        () => toast(UNSAVED_CHANGES_TOAST),
      );
    }, 200);
  }, [applyOperation]);

  const form = useForm<Action | Trigger>({
    mode: 'onChange',
    disabled: readonly,
    reValidateMode: 'onChange',
    defaultValues,
    resolver: typeboxResolver(formSchema),
  });

  useDeepCompareEffect(() => {
    form.trigger();
  }, [formSchema, defaultValues]);

  useEffect(() => {
    form.reset(defaultValues);
    form.trigger();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [refreshPieceFormSettings]);

  const actionOrTriggerDisplayName = selectedStep.settings.actionName
    ? pieceModel?.actions[selectedStep.settings.actionName]?.displayName
    : selectedStep.settings.triggerName
    ? pieceModel?.triggers[selectedStep.settings.triggerName]?.displayName
    : null;

  // Watch changes in form execluding actionName or triggerName from watching //
  const inputChanges = useWatch({
    name: 'settings.input',
    control: form.control,
  });

  const itemsChange = useWatch({
    name: 'settings.items',
    control: form.control,
  });

  const conditionsChange = useWatch({
    name: 'settings.conditions',
    control: form.control,
  });

  const branchesChange = useWatch({
    name: 'settings.branches',
    control: form.control,
  });

  const excutionTypeChange = useWatch({
    name: 'settings.executionType',
    control: form.control,
  });
  const sourceCodeChange = useWatch({
    name: 'settings.sourceCode',
    control: form.control,
  });
  const inputUIInfo = useWatch({
    name: 'settings.inputUiInfo',
    control: form.control,
  });

  const errorHandlingOptions = useWatch({
    name: 'settings.errorHandlingOptions',
    control: form.control,
  });

  const displayName = useWatch({
    name: 'displayName',
    control: form.control,
  });

  const previousSavedStep = useRef<Action | Trigger | null>(null);

  useEffect(() => {
    //added timeout to avoid formstate validity not being updated when values are edited
    setTimeout(() => {
      const currentStep: Trigger | Action = JSON.parse(
        JSON.stringify(form.getValues()),
      );
      currentStep.valid = form.formState.isValid;

      const routerBranchesNumberChanged =
        currentStep.type === ActionType.ROUTER &&
        previousSavedStep.current?.type === ActionType.ROUTER &&
        previousSavedStep.current.settings.branches.length !==
          currentStep.settings.branches.length;
      if (
        previousSavedStep.current === null ||
        deepEqual(currentStep, previousSavedStep.current) ||
        routerBranchesNumberChanged
      ) {
        previousSavedStep.current = currentStep;
        return;
      }

      previousSavedStep.current = currentStep;
      if (currentStep.type === TriggerType.PIECE) {
        debouncedTrigger(currentStep as Trigger);
      } else {
        debouncedAction(currentStep as Action);
      }
    });
  }, [
    inputChanges,
    itemsChange,
    errorHandlingOptions,
    conditionsChange,
    sourceCodeChange,
    inputUIInfo,
    displayName,
    branchesChange,
    excutionTypeChange,
  ]);
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
            {isNil(selectedBranchIndex) ? (
              <EditableText
                onValueChange={(value) => {
                  if (value) {
                    form.setValue('displayName', value);
                  }
                }}
                readonly={readonly}
                value={modifiedStep.displayName}
                tooltipContent={readonly ? '' : t('Edit Step Name')}
                isEditing={isEditingStepOrBranchName}
                setIsEditing={setIsEditingStepOrBranchName}
              ></EditableText>
            ) : (
              <>
                <div
                  className="truncate cursor-pointer hover:underline"
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedBranchIndex(null);
                  }}
                >
                  {modifiedStep.displayName}
                </div>
                /
                <EditableText
                  key={
                    modifiedStep.settings.branches?.[selectedBranchIndex]
                      ?.branchName
                  }
                  onValueChange={(value) => {
                    if (value) {
                      form.setValue(
                        `settings.branches[${selectedBranchIndex}].branchName`,
                        value,
                      );
                    }
                  }}
                  readonly={readonly}
                  value={
                    modifiedStep.settings.branches?.[selectedBranchIndex]
                      ?.branchName
                  }
                  tooltipContent={readonly ? '' : t('Edit Branch Name')}
                  isEditing={isEditingStepOrBranchName}
                  setIsEditing={setIsEditingStepOrBranchName}
                ></EditableText>
              </>
            )}
            {!isEditingStepOrBranchName && !readonly && (
              <Pencil
                className="h-4 w-4 shrink-0"
                onClick={() => {
                  setIsEditingStepOrBranchName(true);
                }}
              />
            )}
          </SidebarHeader>
        </div>

        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={55}>
            <ScrollArea className="h-full">
              <div className="flex flex-col gap-4 px-4 pb-6">
                {stepMetadata && (
                  <PieceCardInfo
                    piece={stepMetadata}
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
                      modifiedStep.settings.errorHandlingOptions
                        ?.continueOnFailure?.hide
                    }
                    disabled={readonly}
                    hideRetryOnFailure={
                      modifiedStep.settings.errorHandlingOptions?.retryOnFailure
                        ?.hide
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
