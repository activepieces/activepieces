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

import { AutoPropertiesFormComponent } from '../../piece-properties/auto-properties-form';
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
  const { pieceModel } = useStepSettingsContext();

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

  const { data: frontendUrl } = flagsHooks.useFlag<string>(
    ApFlagId.FRONTEND_URL,
  );
  const markdownVariables = {
    webhookUrl: `${webhookPrefixUrl}/${props.flowId}`,
    formUrl: `${frontendUrl}/forms/${props.flowId}`,
    chatUrl: `${frontendUrl}/chats/${props.flowId}`,
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
        <div className="space-y-2">
          {Array.from({ length: 5 }).map((_, index) => (
            <Skeleton key={index} className="w-full h-8" />
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
            <AutoPropertiesFormComponent
              key={selectedAction.name}
              prefixValue={'settings.input'}
              props={actionPropsWithoutAuth}
              allowDynamicValues={true}
              disabled={props.readonly}
              useMentionTextInput={true}
              markdownVariables={markdownVariables}
            ></AutoPropertiesFormComponent>
          )}
          {selectedTrigger && (
            <AutoPropertiesFormComponent
              key={selectedTrigger.name}
              prefixValue={'settings.input'}
              props={triggerPropsWithoutAuth}
              useMentionTextInput={true}
              allowDynamicValues={true}
              disabled={props.readonly}
              markdownVariables={markdownVariables}
            ></AutoPropertiesFormComponent>
          )}
        </>
      )}
    </div>
  );
});

PieceSettings.displayName = 'PieceSettings';
export { PieceSettings };
