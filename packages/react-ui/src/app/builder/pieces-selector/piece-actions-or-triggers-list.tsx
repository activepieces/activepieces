import { t } from 'i18next';
import { MoveLeft } from 'lucide-react';
import React from 'react';

import { CardList, CardListItem } from '@/components/custom/card-list';
import { ScrollArea } from '@/components/ui/scroll-area';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import { CORE_ACTIONS } from '@/features/pieces/lib/step-utils';
import {
  PieceSelectorItem,
  PieceSelectorOperation,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { cn } from '@/lib/utils';
import { ActionType, isNil, TriggerType } from '@activepieces/shared';

import { useBuilderStateContext } from '../builder-hooks';

type PieceActionsOrTriggersListProps = {
  hidePieceIcon: boolean;
  stepMetadataWithSuggestions: StepMetadataWithSuggestions | null;
  operation: PieceSelectorOperation;
};

const convertStepMetadataToPieceSelectorItem = (
  stepMetadataWithSuggestions: StepMetadataWithSuggestions,
): PieceSelectorItem[] => {
  switch (stepMetadataWithSuggestions.type) {
    case ActionType.PIECE: {
      const actions = Object.values(
        stepMetadataWithSuggestions.suggestedActions ?? {},
      );
      return actions.map((action) => ({
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
      return CORE_ACTIONS.filter(
        (step) => step.type === stepMetadataWithSuggestions.type,
      );
    }
    default: {
      return [];
    }
  }
};

const getPieceSelectorItemInfo = (item: PieceSelectorItem) => {
  if (item.type === ActionType.PIECE || item.type === TriggerType.PIECE) {
    return {
      displayName: item.actionOrTrigger.displayName,
      description: item.actionOrTrigger.description,
    };
  }
  return {
    displayName: item.displayName,
    description: item.description,
  };
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

  const actionsOrTriggers = convertStepMetadataToPieceSelectorItem(
    stepMetadataWithSuggestions,
  );

  return (
    <ScrollArea className="h-full" viewPortClassName="h-full">
      <CardList className="min-w-[350px] h-full gap-0" listClassName="gap-0">
        {actionsOrTriggers &&
          actionsOrTriggers.map((item, index) => (
            <CardListItem
              className="p-2 w-full"
              key={getPieceSelectorItemInfo(item).displayName + index}
              onClick={() => {
                handleAddingOrUpdatingStep(item, operation);
              }}
            >
              <div className="flex gap-3 items-center">
                <div
                  className={cn({
                    'opacity-0': hidePieceIcon,
                  })}
                >
                  <PieceIcon
                    logoUrl={stepMetadataWithSuggestions.logoUrl}
                    displayName={stepMetadataWithSuggestions.displayName}
                    showTooltip={false}
                    size={'sm'}
                  />
                </div>
                <div className="flex flex-col gap-0.5">
                  <div className="text-sm">
                    {getPieceSelectorItemInfo(item).displayName}
                  </div>
                  <div className="text-xs text-muted-foreground">
                    {getPieceSelectorItemInfo(item).description}
                  </div>
                </div>
              </div>
            </CardListItem>
          ))}
      </CardList>
    </ScrollArea>
  );
};
