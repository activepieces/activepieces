import { typeboxResolver } from '@hookform/resolvers/typebox';
import React, { useEffect, useMemo, useState } from 'react';
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
import { ActionErrorHandlingForm } from '@/features/properties-form/components/action-error-handling';
import {
  Action,
  ActionType,
  FlowOperationType,
  Trigger,
  TriggerType,
  debounce,
  flowHelper,
} from '@activepieces/shared';

import { SidebarHeader } from '../sidebar-header';
import { TestActionComponent } from '../test-step/test-action';
import { Value } from '@sinclair/typebox/value';
import { BranchSettings } from './branch-settings/branch-settings';
import { CodeSettings } from './code-settings/code-settings';
import { LoopsSettings } from './loops-settings';
import { formUtils } from '@/features/properties-form/lib/form-utils';
import { piecesApi } from '@/features/pieces/lib/pieces-api';
import { PieceMetadataModel } from '../../../../../pieces/community/framework/src';
import { PieceSettings } from './piece-settings/piece-settings';
import { PieceCardInfo } from '@/features/pieces/components/piece-card-info';

type StepSettingsContainerProps = {
  selectedStep: Action | Trigger;
}
const StepSettingsContainer = React.memo(({ selectedStep }: StepSettingsContainerProps) => {

  const [readonly, exitStepSettings, applyOperation, saving, flowVersion] = useBuilderStateContext((state) => [
    state.readonly,
    state.exitStepSettings,
    state.applyOperation,
    state.saving,
    state.flowVersion,
  ]);

  const [pieceModel, setPieceModel] = useState<PieceMetadataModel | null>(null);

  useEffect(() => {
    const pieceName = selectedStep?.settings.pieceName;
    const pieceVersion = selectedStep?.settings.pieceVersion;
    if (!pieceName || !pieceVersion) {
      return;
    }

    piecesApi.get({ name: pieceName, version: pieceVersion }).then(setPieceModel);
  }, [selectedStep]);

  const { toast } = useToast();
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
    context: {
      pieceModel,
      selectedStep
    },
    reValidateMode: 'onChange',
    defaultValues: formUtils.buildPieceDefaultValue(selectedStep!, pieceModel),
    resolver: (values, context, options) => {
      const formSchema = formUtils.buildPieceSchema(context.selectedStep, context.pieceModel);
      return typeboxResolver(formSchema)(values, context, options);
    }
  })

  const inputChanges = useWatch({
    name: 'settings.input',
    control: form.control,
  })
  const itemsChange = useWatch({
    name: 'settings.items',
    control: form.control,
  })
  const conditionsChange = useWatch({
    name: 'settings.conditions',
    control: form.control,
  })
  const sourceCodeChange = useWatch({
    name: 'settings.sourceCode',
    control: form.control,
  })
  const actionName = useWatch({
    name: 'settings.actionName',
    control: form.control,
  })
  const triggerName = useWatch({
    name: 'settings.triggerName',
    control: form.control,
  })

  useUpdateEffect(() => {
    const currentStep = JSON.parse(JSON.stringify(form.getValues()))
    const newValue = formUtils.buildPieceDefaultValue(currentStep, pieceModel);
    console.log("action name changed", newValue);
    form.reset(newValue);
  }, [actionName, triggerName]);


  useUpdateEffect(() => {
    const formSchema = formUtils.buildPieceSchema(selectedStep, pieceModel);
    const castedForm = Value.Clean(
      formSchema,
      JSON.parse(JSON.stringify(form.getValues())),
    ) as Action | Trigger;
    debouncedAction(castedForm as Action);
  }, [inputChanges, itemsChange, conditionsChange, sourceCodeChange]);

  const modifiedStep = form.getValues();
  return (
    <Form {...form}>
      <form onSubmit={(e) => e.preventDefault()} onChange={(e) => e.preventDefault()} className='w-full h-full'>
        <SidebarHeader onClose={() => exitStepSettings()}>
          {modifiedStep.displayName}
        </SidebarHeader>
        <ResizablePanelGroup direction="vertical">
          <ResizablePanel defaultSize={55}>
            <ScrollArea className="h-full ">
              <div className="flex flex-col gap-4 px-4">
                {pieceModel && <PieceCardInfo piece={pieceModel}></PieceCardInfo>}
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
                {[ActionType.CODE, TriggerType.PIECE, ActionType.PIECE].includes(modifiedStep.type) && (
                  <ActionErrorHandlingForm
                    hideContinueOnFailure={
                      modifiedStep.settings.errorHandlingOptions
                        ?.continueOnFailure?.hide
                    }
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
});
StepSettingsContainer.displayName = 'StepSettingsContainer';
export { StepSettingsContainer };
