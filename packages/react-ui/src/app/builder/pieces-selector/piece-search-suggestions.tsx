import { CardListItem } from '@/components/ui/card-list';
import { FlowOperationType } from '@activepieces/shared';

import { PieceIcon } from '@/features/pieces/components/piece-icon';
import {
  StepMetadata,
  ActionOrTriggerListItem,
  PieceSelectorOperation,
  PieceStepMetadataWithSuggestions,
} from '@/features/pieces/lib/types';

type HandleSelectCallback = (
  piece: StepMetadata,
  item: ActionOrTriggerListItem,
) => void;

type PieceSearchSuggestionsProps = {
  pieceMetadata: PieceStepMetadataWithSuggestions;
  handleSelectOperationSuggestion: HandleSelectCallback;
  operation: PieceSelectorOperation;
};

const PieceSearchSuggestions = ({
  pieceMetadata,
  handleSelectOperationSuggestion,
  operation,
}: PieceSearchSuggestionsProps) => {
  const suggestions =
    operation.type === FlowOperationType.UPDATE_TRIGGER
      ? pieceMetadata.suggestedTriggers
      : pieceMetadata.suggestedActions;

  return (
    <div className="flex flex-col gap-0">
      {suggestions?.map((suggestion) => (
        <CardListItem
          className="p-3 px-0 text-sm gap-2 items-start "
          key={suggestion.name}
          onClick={(e) => {
            e.stopPropagation();
            handleSelectOperationSuggestion(pieceMetadata, suggestion);
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
