import { CardListItem } from '@/components/ui/card-list';
import { FlowOperationType } from '@activepieces/shared';

import {
  StepMetadata,
  ActionOrTriggerListItem,
  PieceSelectorOperation,
  PieceStepMetadataWithSuggestions,
} from '../lib/types';

import { PieceIcon } from './piece-icon';

type HandleSelectCallback = (
  piece: StepMetadata,
  item: ActionOrTriggerListItem,
) => void;

type PieceOperationSuggestionsProps = {
  pieceMetadata: PieceStepMetadataWithSuggestions;
  handleSelectOperationSuggestion: HandleSelectCallback;
  operation: PieceSelectorOperation;
};

const PieceOperationSuggestions = ({
  pieceMetadata,
  handleSelectOperationSuggestion,
  operation,
}: PieceOperationSuggestionsProps) => {
  const suggestions =
    operation.type === FlowOperationType.UPDATE_TRIGGER
      ? pieceMetadata.suggestedTriggers
      : pieceMetadata.suggestedActions;

  return (
    <div className="flex flex-col gap-2">
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

export { PieceOperationSuggestions };
