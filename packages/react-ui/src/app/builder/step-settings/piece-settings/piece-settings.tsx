import { useQueryClient } from '@tanstack/react-query';
import React from 'react';

import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { flagsHooks } from '@/hooks/flags-hooks';
import {
  ApFlagId,
  PieceAction,
  PieceActionSettings,
  PieceTrigger,
  PieceTriggerSettings,
} from '@activepieces/shared';

import { AutoPropertiesFormComponent } from '../../piece-properties/auto-properties-form';

import { ConnectionSelect } from './connection-select';
import { PieceActionTriggerSelector } from './piece-action-trigger-selector';

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
  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: props.step.settings.pieceName,
    version: props.step.settings.pieceVersion,
  });

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

  const queryClient = useQueryClient();
  const { data: webhookPrefixUrl } = flagsHooks.useFlag<string>(
    ApFlagId.WEBHOOK_URL_PREFIX,
    queryClient,
  );

  const markdownVariables = {
    webhookUrl: `${webhookPrefixUrl}/${props.flowId}`,
  };

  return (
    <div className="flex flex-col gap-4 w-full">
      {pieceModel && (
        <>
          <PieceActionTriggerSelector
            piece={pieceModel}
            isLoading={isLoading}
            type={props.step.type}
            disabled={props.readonly}
          ></PieceActionTriggerSelector>
          {pieceModel.auth &&
            (selectedAction?.requireAuth || selectedTrigger) && (
              <ConnectionSelect
                piece={pieceModel}
                disabled={props.readonly}
              ></ConnectionSelect>
            )}
          {selectedAction && (
            <AutoPropertiesFormComponent
              key={selectedAction.name}
              prefixValue="settings.input"
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
              prefixValue="settings.input"
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
