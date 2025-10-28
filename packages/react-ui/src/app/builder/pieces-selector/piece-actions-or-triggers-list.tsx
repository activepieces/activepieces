import { t } from 'i18next';
import { MoveLeft } from 'lucide-react';
import React from 'react';

import { CardList } from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { pieceSelectorUtils } from '@/features/pieces/lib/piece-selector-utils';
import { CORE_ACTIONS_METADATA } from '@/features/pieces/lib/step-utils';
import {
  PieceSelectorItem,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/lib/types';
import { FlowActionType, isNil, FlowTriggerType } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

import { CreateTodoDialog } from './add-todo-step-dialog';
import GenericActionOrTriggerItem from './generic-piece-selector-item';
import RunAgentActionItem from './run-agent-action-item';
type PieceActionsOrTriggersListProps = {
  hidePieceIconAndDescription: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions | null;
  operation: PieceSelectorOperation;
};
const convertStepMetadataToPieceSelectorItems = (
  stepMetadataWithSuggestions: StepMetadataWithSuggestions,
): PieceSelectorItem[] => {
  switch (stepMetadataWithSuggestions.type) {
    case FlowActionType.PIECE: {
      const actions = pieceSelectorUtils.removeHiddenActions(
        stepMetadataWithSuggestions,
      );
      return actions.map((action) => ({
        actionOrTrigger: action,
        type: FlowActionType.PIECE,
        pieceMetadata: stepMetadataWithSuggestions,
      }));
    }
    case FlowTriggerType.PIECE: {
      const triggers = Object.values(
        stepMetadataWithSuggestions.suggestedTriggers ?? {},
      );
      return triggers.map((trigger) => ({
        actionOrTrigger: trigger,
        type: FlowTriggerType.PIECE,
        pieceMetadata: stepMetadataWithSuggestions,
      }));
    }
    case FlowActionType.CODE:
    case FlowActionType.LOOP_ON_ITEMS:
    case FlowActionType.ROUTER: {
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
> = ({
  stepMetadataWithSuggestions,
  hidePieceIconAndDescription,
  operation,
}) => {
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
            const isCreateTodoAction =
              item.type === FlowActionType.PIECE &&
              item.actionOrTrigger.name === 'createTodo';
            const isRunAgentAction =
              item.type === FlowActionType.PIECE &&
              item.actionOrTrigger.name === 'run_agent';

            if (isCreateTodoAction) {
              return (
                <CreateTodoDialog
                  key={index}
                  pieceSelectorItem={item}
                  operation={operation}
                  hidePieceIconAndDescription={hidePieceIconAndDescription}
                />
              );
            }
            if (isRunAgentAction) {
              return (
                <RunAgentActionItem
                  key={index}
                  pieceSelectorItem={item}
                  operation={operation}
                  hidePieceIconAndDescription={hidePieceIconAndDescription}
                />
              );
            }
            return (
              <GenericActionOrTriggerItem
                key={index}
                item={item}
                hidePieceIconAndDescription={hidePieceIconAndDescription}
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
          })}
      </CardList>
    </ScrollArea>
  );
};
