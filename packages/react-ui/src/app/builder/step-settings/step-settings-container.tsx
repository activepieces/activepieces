import { typeboxResolver } from '@hookform/resolvers/typebox';
import { Value } from '@sinclair/typebox/value';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useForm, useWatch } from 'react-hook-form';
import { useUpdateEffect } from 'react-use';

import { useBuilderStateContext } from '@/app/builder/builder-hooks';
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
  flowHelper,
} from '@activepieces/shared';

import { ActionErrorHandlingForm } from '../piece-properties/action-error-handling';
import { formUtils } from '../piece-properties/form-utils';
import { SidebarHeader } from '../sidebar-header';
import { TestActionComponent } from '../test-step/test-action';

import { BranchSettings } from './branch-settings/branch-settings';
import { CodeSettings } from './code-settings/code-settings';
import { LoopsSettings } from './loops-settings';
import { PieceSettings } from './piece-settings/piece-settings';
import { PieceCardInfo } from '../../../features/pieces/components/piece-selector-card';

type StepSettingsContainerProps = {
  selectedStep: Action | Trigger;
};
const StepSettingsContainer = React.memo(
  ({ selectedStep }: StepSettingsContainerProps) => {
    const [readonly, exitStepSettings, applyOperation, saving, flowVersion] =
      useBuilderStateContext((state) => [
        state.readonly,
        state.exitStepSettings,
        state.applyOperation,
        state.saving,
        state.flowVersion,
      ]);

    const { pieceModel } = piecesHooks.usePiece({
      name: selectedStep?.settings.pieceName,
      version: selectedStep?.settings.pieceVersion,
      enabled:
        selectedStep?.type === ActionType.PIECE ||
        selectedStep?.type === TriggerType.PIECE,
    });

    const [actionOrTriggerName, setActionOrTriggerName] = useState<string>(
      selectedStep?.settings?.actionName ??
      selectedStep?.settings?.triggerName ??
      '',
    );

    const { stepMetadata } = piecesHooks.useStepMetadata({
      step: selectedStep,
    });

    const { toast } = useToast();

    const debouncedTrigger = useMemo(() => {
      const updateTrigger = (newTrigger: Trigger) => {
        applyOperation(
          {
            type: FlowOperationType.UPDATE_TRIGGER,
            request: newTrigger,
          },
          () => toast(UNSAVED_CHANGES_TOAST),
        );
      };
      return debounce(updateTrigger, 200);
    }, [applyOperation]);
    const debouncedAction = useMemo(() => {
      const updateAction = (newAction: Action) => {
        applyOperation(
          {
            type: FlowOperationType.UPDATE_ACTION,
            request: newAction,
          },
          () => toast(UNSAVED_CHANGES_TOAST),
        );
      };

      return debounce(updateAction, 200);
    }, [applyOperation]);

    const form = useForm<Action | Trigger>({
      mode: 'all',
      reValidateMode: 'onChange',
      context: {
        pieceModel,
        selectedStep,
        actionOrTriggerName,
      },
      resolver: (values, context, options) => {
        const formSchema = formUtils.buildPieceSchema(
          context.selectedStep.type,
          context.actionOrTriggerName,
          context.pieceModel,
        );
        return typeboxResolver(formSchema)(values, context, options);
      },
    });

    const hasExecuted = useRef(false);

    useEffect(() => {
      if (hasExecuted.current || !selectedStep) {
        return;
      }

      if (
        !pieceModel &&
        (selectedStep.type === ActionType.PIECE ||
          selectedStep.type === TriggerType.PIECE)
      ) {
        return;
      }

      hasExecuted.current = true;
      const defaultValues = formUtils.buildPieceDefaultValue(
        selectedStep,
        pieceModel ?? null,
      );
      form.reset(defaultValues);
      form.trigger();
      // TODO workaround to validate code action, I don't understand why it's not validating.
      const _formValid = form.formState.isValid;
    }, [selectedStep, pieceModel]);

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
    const sourceCodeChange = useWatch({
      name: 'settings.sourceCode',
      control: form.control,
    });
    const actionName = useWatch({
      name: 'settings.actionName',
      control: form.control,
    });
    const triggerName = useWatch({
      name: 'settings.triggerName',
      control: form.control,
    });

    useUpdateEffect(() => {
      const currentStep = JSON.parse(JSON.stringify(form.getValues()));
      setActionOrTriggerName(
        currentStep.settings.actionName ??
        currentStep.settings.triggerName ??
        '',
      );
      const newValue = formUtils.buildPieceDefaultValue(
        currentStep,
        pieceModel!,
      );
      form.reset(newValue);
      form.trigger();
    }, [actionName, triggerName]);

    useUpdateEffect(() => {
      const currentStep = JSON.parse(JSON.stringify(form.getValues()));
      const formSchema = formUtils.buildPieceSchema(
        currentStep.type,
        actionOrTriggerName,
        pieceModel!,
      );
      const castedForm = Value.Clean(
        formSchema,
        JSON.parse(JSON.stringify(form.getValues())),
      ) as Action | Trigger;
      if (currentStep.type === TriggerType.PIECE) {
        debouncedTrigger(castedForm as Trigger);
      } else {
        debouncedAction(castedForm as Action);
      }
    }, [inputChanges, itemsChange, conditionsChange, sourceCodeChange]);

    const modifiedStep = form.getValues();
    return (
      <Form {...form}>
        <form
          onSubmit={(e) => e.preventDefault()}
          onChange={(e) => e.preventDefault()}
          className="w-full h-full"
        >
          <SidebarHeader onClose={() => exitStepSettings()}>
            {modifiedStep.displayName}
          </SidebarHeader>
          <ResizablePanelGroup direction="vertical">
            <ResizablePanel defaultSize={55}>
              <ScrollArea className="h-full ">
                <div className="flex flex-col gap-4 px-4">
                  {stepMetadata && (
                    <PieceCardInfo piece={stepMetadata} interactive={false}></PieceCardInfo>
                  )}
                  {modifiedStep.type === ActionType.LOOP_ON_ITEMS && (
                    <LoopsSettings></LoopsSettings>
                  )}
                  {modifiedStep.type === ActionType.CODE && (
                    <CodeSettings readonly={readonly}></CodeSettings>
                  )}
                  {modifiedStep.type === ActionType.BRANCH && (
                    <BranchSettings></BranchSettings>
                  )}
                  {modifiedStep.type === ActionType.PIECE && modifiedStep && (
                    <PieceSettings step={modifiedStep}></PieceSettings>
                  )}
                  {modifiedStep.type === TriggerType.PIECE && modifiedStep && (
                    <PieceSettings step={modifiedStep}></PieceSettings>
                  )}
                  {[ActionType.CODE, ActionType.PIECE].includes(
                    modifiedStep.type as ActionType,
                  ) && (
                      <ActionErrorHandlingForm
                        hideContinueOnFailure={
                          modifiedStep.settings.errorHandlingOptions
                            ?.continueOnFailure?.hide
                        }
                        hideRetryOnFailure={
                          modifiedStep.settings.errorHandlingOptions
                            ?.retryOnFailure?.hide
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
                  <ScrollArea className="h-full">
                    <div className="p-4 flex flex-col gap-4 h-full">
                      {flowHelper.isAction(modifiedStep.type) && (
                        <TestActionComponent
                          flowVersionId={flowVersion.id}
                          isSaving={saving}
                        ></TestActionComponent>
                      )}
                    </div>
                  </ScrollArea>
                </ResizablePanel>
              </>
            )}
          </ResizablePanelGroup>
        </form>
      </Form>
    );
  },
);
StepSettingsContainer.displayName = 'StepSettingsContainer';
export { StepSettingsContainer };
