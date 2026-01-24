import React from 'react';

import { Skeleton } from '@/components/ui/skeleton';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  ApFlagId,
  isNil,
  PieceAction,
  PieceActionSettings,
  PieceTrigger,
  PieceTriggerSettings,
} from '@activepieces/shared';

import { GenericPropertiesForm } from '../../piece-properties/generic-properties-form';
import { useStepSettingsContext } from '../step-settings-context';

import { ConnectionSelect } from './connection-select';

type PieceSettingsProps = {
  step: PieceAction | PieceTrigger;
  flowId: string;
  readonly: boolean;
};

const removeAuthFromProps = (
  props: Record<string, any>,
): Record<string, any> => {
  const { auth, ...rest } = props;
  return rest;
};

const PieceSettings = React.memo((props: PieceSettingsProps) => {
  const {
    pieceModel,
    selectedStep,
    updateFormSchema,
    updatePropertySettingsSchema,
  } = useStepSettingsContext();

  const actionName = (props.step.settings as PieceActionSettings).actionName;
  const selectedAction = actionName
    ? pieceModel?.actions[actionName]
    : undefined;
  const triggerName = (props.step.settings as PieceTriggerSettings).triggerName;
  const selectedTrigger = triggerName
    ? pieceModel?.triggers[triggerName]
    : undefined;

  const actionPropsWithoutAuth = removeAuthFromProps(
    selectedAction?.props ?? {},
  );
  const triggerPropsWithoutAuth = removeAuthFromProps(
    selectedTrigger?.props ?? {},
  );

  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
  );

  const { data: pausedFlowTimeoutDays } = flagsHooks.useFlag<number>(
    ApFlagId.PAUSED_FLOW_TIMEOUT_DAYS,
  );

  const { data: webhookTimeoutSeconds } = flagsHooks.useFlag<number>(
    ApFlagId.WEBHOOK_TIMEOUT_SECONDS,
  );

  const { data: frontendUrl } = flagsHooks.useFlag<string>(ApFlagId.PUBLIC_URL);
  const markdownVariables = {
    webhookUrl: `${webhookPrefixUrl}/${props.flowId}`,
    formUrl: `${frontendUrl}forms/${props.flowId}`,
    chatUrl: `${frontendUrl}chats/${props.flowId}`,
    pausedFlowTimeoutDays: pausedFlowTimeoutDays?.toString() ?? '',
    webhookTimeoutSeconds: webhookTimeoutSeconds?.toString() ?? '',
  };

  const showAuthForAction =
    !isNil(selectedAction) && (selectedAction.requireAuth ?? true);
  const showAuthForTrigger =
    !isNil(selectedTrigger) && (selectedTrigger.requireAuth ?? true);
  return (
    <div className="flex flex-col gap-4 w-full">
      {!pieceModel && (
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, index) => (
            <div className="space-y-2" key={index}>
              <div className="flex justify-between items-center">
                <Skeleton className="w-40 h-4" />
                <Skeleton className="size-8" />
              </div>
              <Skeleton className="w-full h-12" />
            </div>
          ))}
        </div>
      )}

      {pieceModel && (
        <>
          {pieceModel.auth && (showAuthForAction || showAuthForTrigger) && (
            <ConnectionSelect
              isTrigger={!isNil(selectedTrigger)}
              piece={pieceModel}
              disabled={props.readonly}
            ></ConnectionSelect>
          )}
          {selectedAction && (
            <GenericPropertiesForm
              key={selectedAction.name}
              prefixValue={'settings.input'}
              props={actionPropsWithoutAuth}
              propertySettings={selectedStep.settings.propertySettings}
              disabled={props.readonly}
              useMentionTextInput={true}
              markdownVariables={markdownVariables}
              dynamicPropsInfo={{
                pieceName: pieceModel.name,
                pieceVersion: pieceModel.version,
                actionOrTriggerName: selectedAction.name,
                placedInside: 'stepSettings',
                updateFormSchema,
                updatePropertySettingsSchema,
              }}
            ></GenericPropertiesForm>
          )}
          {selectedTrigger && (
            <GenericPropertiesForm
              dynamicPropsInfo={{
                pieceName: pieceModel.name,
                pieceVersion: pieceModel.version,
                actionOrTriggerName: selectedTrigger.name,
                placedInside: 'stepSettings',
                updateFormSchema,
                updatePropertySettingsSchema,
              }}
              key={selectedTrigger.name}
              prefixValue={'settings.input'}
              props={triggerPropsWithoutAuth}
              useMentionTextInput={false}
              propertySettings={selectedStep.settings.propertySettings}
              disabled={props.readonly}
              markdownVariables={markdownVariables}
            ></GenericPropertiesForm>
          )}
        </>
      )}
    </div>
  );
});

PieceSettings.displayName = 'PieceSettings';
export { PieceSettings };
