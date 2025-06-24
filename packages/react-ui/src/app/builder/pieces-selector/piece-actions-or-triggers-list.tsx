import { t } from 'i18next';
import { MoveLeft } from 'lucide-react';
import React from 'react';

import { CardList } from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { CORE_ACTIONS_METADATA } from '@/features/pieces/lib/step-utils';
import { ActionType, isNil, TriggerType } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { CreateTodoDialog } from './create-todo-dialog';
import GenericActionOrTriggerItem from './generic-piece-selector-item';

import {
  PieceSelectorItem,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/lib/types';

type PieceActionsOrTriggersListProps = {
  hidePieceIcon: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions | null;
  operation: PieceSelectorOperation;
};
const hiddenActions = [
  {
    pieceName: '@activepieces/piece-todos',
    actionName: 'wait_for_approval',
  },
  {
    pieceName: '@activepieces/piece-todos',
    actionName: 'createTodoAndWait',
  },
];
const convertStepMetadataToPieceSelectorItems = (
  stepMetadataWithSuggestions: StepMetadataWithSuggestions,
): PieceSelectorItem[] => {
  switch (stepMetadataWithSuggestions.type) {
    case ActionType.PIECE: {
      const actions = Object.values(
        stepMetadataWithSuggestions.suggestedActions ?? {},
      );
      const filteredActions = actions.filter(
        (action) =>
          !hiddenActions.some(
            (hidden) =>
              hidden.actionName === action.name &&
              hidden.pieceName === stepMetadataWithSuggestions.pieceName,
          ),
      );
      return filteredActions.map((action) => ({
        actionOrTrigger: action,
        type: ActionType.PIECE,
        pieceMetadata: stepMetadataWithSuggestions,
      }));
    }
    case TriggerType.PIECE: {
      const triggers = Object.values(
        stepMetadataWithSuggestions.suggestedTriggers ?? {},
      );
      return triggers.map((trigger) => ({
        actionOrTrigger: trigger,
        type: TriggerType.PIECE,
        pieceMetadata: stepMetadataWithSuggestions,
      }));
    }
    case ActionType.CODE:
    case ActionType.LOOP_ON_ITEMS:
    case ActionType.ROUTER: {
      return CORE_ACTIONS_METADATA.filter(
        (step) => step.type === stepMetadataWithSuggestions.type,
      );
    }
    default: {
      return [];
    }
  }
};

export const PieceActionsOrTriggersList: React.FC<
  PieceActionsOrTriggersListProps
> = ({ stepMetadataWithSuggestions, hidePieceIcon, operation }) => {
  const [handleAddingOrUpdatingStep] = useBuilderStateContext((state) => [
    state.handleAddingOrUpdatingStep,
  ]);
  if (isNil(stepMetadataWithSuggestions)) {
    return (
      <div className="flex flex-col gap-2 items-center justify-center h-full w-full">
        <MoveLeft className="w-10 h-10 rtl:rotate-180" />
        <div className="text-sm">{t('Please select a piece first')}</div>
      </div>
    );
  }

  const actionsOrTriggers = convertStepMetadataToPieceSelectorItems(
    stepMetadataWithSuggestions,
  );
  return (
    <ScrollArea className="h-full" viewPortClassName="h-full">
      <CardList className="min-w-[350px] h-full gap-0" listClassName="gap-0">
        {actionsOrTriggers &&
          actionsOrTriggers.map((item, index) => {
            switch (item.type) {
              case ActionType.PIECE: {
                switch (item.actionOrTrigger.name) {
                  case 'createTodo': {
                    return (
                      <CreateTodoDialog
                        key={index}
                        pieceSelectorItem={item}
                        operation={operation}
                        hidePieceIcon={hidePieceIcon}
                      />
                    );
                  }

                  default:
                    return (
                      <GenericActionOrTriggerItem
                        key={index}
                        item={item}
                        hidePieceIcon={hidePieceIcon}
                        stepMetadataWithSuggestions={
                          stepMetadataWithSuggestions
                        }
                        onClick={() =>
                          handleAddingOrUpdatingStep({
                            pieceSelectorItem: item,
                            operation,
                            selectStepAfter: true,
                          })
                        }
                      />
                    );
                }
              }
              default:
                return (
                  <GenericActionOrTriggerItem
                    key={index}
                    item={item}
                    hidePieceIcon={hidePieceIcon}
                    stepMetadataWithSuggestions={stepMetadataWithSuggestions}
                    onClick={() =>
                      handleAddingOrUpdatingStep({
                        pieceSelectorItem: item,
                        operation,
                        selectStepAfter: true,
                      })
                    }
                  />
                );
            }
          })}
      </CardList>
    </ScrollArea>
  );
};
