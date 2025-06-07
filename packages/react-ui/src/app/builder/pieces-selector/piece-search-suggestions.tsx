import { useState } from 'react';

import { CardListItem } from '@/components/custom/card-list';
import { PieceIcon } from '@/features/pieces/components/piece-icon';
import {
  HandleSelectCallback,
  PieceStepMetadata,
  StepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';
import { ActionType, TriggerType } from '@activepieces/shared';

import { getCoreActions } from '../../../features/pieces/lib/pieces-hook';

import { CreateTodoGuide } from './dialog-guides/create-todo-guide';

type PieceSearchSuggestionsProps = {
  pieceMetadata: StepMetadataWithSuggestions;
  handleSelectOperationSuggestion: HandleSelectCallback;
  hiddenActionsOrTriggers: string[];
};

const stepMetadataSuggestions = (stepMetadata: StepMetadataWithSuggestions) => {
  switch (stepMetadata.type) {
    case TriggerType.PIECE:
      return stepMetadata.suggestedTriggers;
    case ActionType.PIECE:
      return stepMetadata.suggestedActions;
    case ActionType.CODE:
    case ActionType.ROUTER:
    case ActionType.LOOP_ON_ITEMS: {
      return getCoreActions(stepMetadata.type);
    }
  }
};

const PieceSearchSuggestions = ({
  pieceMetadata,
  handleSelectOperationSuggestion,
  hiddenActionsOrTriggers,
}: PieceSearchSuggestionsProps) => {
  const [openCreateTodoGuideDialog, setOpenCreateTodoGuideDialog] =
    useState(false);
  const suggestions = stepMetadataSuggestions(pieceMetadata);
  return (
    <div className="flex flex-col gap-0">
      {openCreateTodoGuideDialog && pieceMetadata && suggestions && (
        <CreateTodoGuide
          open={openCreateTodoGuideDialog}
          setOpen={setOpenCreateTodoGuideDialog}
          handleSelect={handleSelectOperationSuggestion}
          actionOrTriggers={suggestions}
          selectedPieceMetadata={pieceMetadata}
        />
      )}
      {suggestions
        ?.filter(
          (suggestion) => !hiddenActionsOrTriggers.includes(suggestion.name),
        )
        .map((suggestion) => (
          <CardListItem
            className="p-3 text-sm gap-2 items-center "
            key={suggestion.displayName}
            onClick={(e) => {
              e.stopPropagation();
              if (
                (pieceMetadata as PieceStepMetadata).pieceName ===
                  '@activepieces/piece-todos' &&
                suggestion.name === 'createTodo'
              ) {
                setOpenCreateTodoGuideDialog(true);
              } else {
                handleSelectOperationSuggestion(pieceMetadata, suggestion);
              }
            }}
          >
            <div className="opacity-0">
              <PieceIcon
                logoUrl={pieceMetadata.logoUrl}
                displayName={pieceMetadata.displayName}
                showTooltip={false}
                size={'sm'}
              ></PieceIcon>
            </div>

            <span title={suggestion.displayName}>{suggestion.displayName}</span>
          </CardListItem>
        ))}
    </div>
  );
};

export { PieceSearchSuggestions };
