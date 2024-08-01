import React, { useEffect, useState } from 'react';
import { useFormContext } from 'react-hook-form';

import { piecesHooks } from '@/features/pieces/lib/pieces-hook';
import { ActionBase, TriggerBase } from '@activepieces/pieces-framework';
import {
  ActionType,
  PieceAction,
  PieceTrigger,
  TriggerType,
} from '@activepieces/shared';

import { AutoPropertiesFormComponent } from '../../piece-properties/auto-properties-form';

import { ConnectionSelect } from './connection-select';
import { PieceActionTriggerSelector } from './piece-action-trigger-selector';

type PieceSettingsProps = {
  step: PieceAction | PieceTrigger;
};

const PieceSettings = React.memo((props: PieceSettingsProps) => {
  const [selectedAction, setSelectedAction] = useState<ActionBase | undefined>(
    undefined,
  );
  const [selectedTrigger, setSelectedTrigger] = useState<
    TriggerBase | undefined
  >(undefined);

  const { pieceModel, isLoading } = piecesHooks.usePiece({
    name: props.step.settings.pieceName,
    version: props.step.settings.pieceVersion,
  });

  const form = useFormContext<PieceAction | PieceTrigger>();

  const watchedForm = form.watch([
    'settings.actionName',
    'settings.triggerName',
  ]);

  useEffect(() => {
    switch (props.step.type) {
      case ActionType.PIECE: {
        const actionName = (form.getValues() as PieceAction).settings
          .actionName;
        if (actionName) {
          setSelectedAction(pieceModel?.actions[actionName]);
        }
        break;
      }
      case TriggerType.PIECE: {
        const triggerName = (form.getValues() as PieceTrigger).settings
          .triggerName;
        if (triggerName) {
          setSelectedTrigger(pieceModel?.triggers[triggerName]);
        }
        break;
      }
    }
  }, [watchedForm]);

  const removeAuthFromProps = (
    props: Record<string, any>,
  ): Record<string, any> => {
    const { auth, ...rest } = props;
    return rest;
  };

  const actionPropsWithoutAuth = removeAuthFromProps(
    selectedAction?.props ?? {},
  );
  const triggerPropsWithoutAuth = removeAuthFromProps(
    selectedTrigger?.props ?? {},
  );

  return (
    <div className="flex flex-col gap-4 w-full">
      {pieceModel && (
        <>
          <PieceActionTriggerSelector
            piece={pieceModel}
            isLoading={isLoading}
            type={props.step.type}
          ></PieceActionTriggerSelector>
          {pieceModel.auth && selectedAction?.requireAuth && (
            <ConnectionSelect piece={pieceModel}></ConnectionSelect>
          )}
          {pieceModel.auth && selectedTrigger && (
            <ConnectionSelect piece={pieceModel}></ConnectionSelect>
          )}
          {selectedAction && (
            <AutoPropertiesFormComponent
              key={selectedAction.name}
              prefixValue="settings.input"
              props={actionPropsWithoutAuth}
              allowDynamicValues={true}
            ></AutoPropertiesFormComponent>
          )}
          {selectedTrigger && (
            <AutoPropertiesFormComponent
              key={selectedTrigger.name}
              prefixValue="settings.input"
              props={triggerPropsWithoutAuth}
              allowDynamicValues={true}
            ></AutoPropertiesFormComponent>
          )}
        </>
      )}
    </div>
  );
});

PieceSettings.displayName = 'PieceSettings';
export { PieceSettings };
